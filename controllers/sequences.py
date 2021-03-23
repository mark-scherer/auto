'''
    File for storing all controller sequences
    Sequences control output thru a designated pattern, either:
        - to an end state or
        - over an infitie pattern
    Sequences should be as generic as possible
        - specific entries the config should call one with params

    TO DO: 
        1. add ability to stop runnin sequence
        2. add sequences to frontend
'''

import math
import time
import sys
import os
import colorsys
import copy
import json 

_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(_dir, '../utils/'))
import utils_misc

class Sequence:

    # all kwargs are created as class vars
    def __init__(self, **kwargs):
        
        ''' class vars required to be overridden
            self.required_args
            self.timestep
        '''

        base_required_args = ['pin_controller']

        # check that required args are provided
        if self.required_args == None:
            raise NotImplementedError(f'sequence {self.__class__.__name__} not fully implemented: missing self.required_args')
        all_required_args = list(self.required_args)
        all_required_args.extend(base_required_args)
        for arg in all_required_args:
            if arg not in kwargs.keys():
                raise ValueError(f'missing param to sequence {self.__class__.__name__}: {arg}')

        # setup for execution
        self.__dict__.update(kwargs)
    
    # public method to run sequence
    def run(self):
        if not self._run:
            raise NotImplementedError(f'sequence {self.__class__.__name__} not fully implemented: missing self._run()')
        if not self.timestep:
            raise NotImplementedError(f'sequence {self.__class__.__name__} not fully implemented: missing self.timestep')
        
        # trigger sequence loop in stoppable, non-blocking thread
        self.run_loop = utils_misc.NonBlockingLoopingFunc(self.timestep, self._run)
        self.run_loop.start()
    
    # closeout method for sequence kill/stop, can be overridden
        # from Sequence._run MUST call passed stop_sequence_func() to close sequence properly! Main server must delete sequence from active list!
    def stop(self):
        self.run_loop.stop()

    # private methods for iteration, should be overridden
    def _run(self, elapsed_time):
        raise NotImplementedError(f'sequence {self.__class__.__name__} not fully implemented: missing self._run()')

    # private method for updating channel intensities
    def _updateChannel(self, output, channel, intensity):
        self.pin_controller.setPin(output, channel, intensity)

    def _getChannelValue(self, output, channel):
        return self.pin_controller.getPinValues()[output][channel]

    # static method for initializing a zero'd sequenc state of all channel intensities
        # outputs guide format: {output_1: [channel_1, ...], ...}
    def _initState(outputs_guide):
        state = {}
        for output, channels in outputs_guide.items():
            state[output] = {}
            for ch in channels:
                state[output][ch] = 0
        return state

# cycle all channels together inputs together
class CycleSequence(Sequence):
    def __init__(self, **kwargs):
        self.required_args = ['period', 'frequency', 'outputs_guide']
        
        # base class constructor checks for valid inputs, assignment involving inputs should occur after they've been validated
        super().__init__(**kwargs)
        self.timestep = 1/kwargs['frequency']

    def _run(self, elapsed_time):
        intensity = 100*(-0.5*math.cos((elapsed_time/self.period) * 2*math.pi) + 0.5)
        for output, channels in self.outputs_guide.items():
            for ch in channels:
                self._updateChannel(output, ch, intensity)

# control 3 channels according to cycling hsv converted to rgb
    # only works for 3 channel outputs
class HsvCycleSequence(Sequence):
    def __init__(self, **kwargs):
        self.required_args = ['period', 'frequency', 'outputs_guide']
        
        # base class constructor checks for valid inputs, assignment involving inputs should occur after they've been validated
        super().__init__(**kwargs)
        
        for output, channels in kwargs['outputs_guide'].items():
            if len(channels) != 3:
                raise ValueError(f'HsvCycleSequence outputs must have exactly 3 channels: {output} found to have {len(channels)}')
        self.timestep = 1/kwargs['frequency']

    def _run(self, elapsed_time):
        raw_cycle_pos = elapsed_time/self.period
        hue = raw_cycle_pos - math.floor(raw_cycle_pos)
        rgb = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
        for output, channels in self.outputs_guide.items():
            for i in range(0, len(channels)):
                self._updateChannel(output, channels[i], 100*rgb[i])

# change outputs to specific final state over constant change =rate
class FixedRateSequence(Sequence):
    def __init__(self, **kwargs):
        self.required_args = ['rate', 'frequency', 'outputs_guide', 'pin_controller', 'end_status', 'stop_sequence_func']

        # base class constructor checks for valid inputs, assignment involving inputs should occur after they've been validated
        super().__init__(**kwargs)
        self.timestep = 1/kwargs['frequency']
        self.cycle_rate = kwargs['rate']/kwargs['frequency'] # rate should be in value units (0-100) per second

    def _run(self, elapsed_time):
        made_adjustment = False
        for output, channels in self.outputs_guide.items():
            for channel in channels:
                end_value = self.end_status[output][channel]
                current_value = self._getChannelValue(output, channel)
                adjustment = utils_misc.clamp(end_value - current_value, -1*self.cycle_rate, self.cycle_rate)
                self._updateChannel(output, channel, current_value + adjustment)
                if adjustment != 0:
                    made_adjustment = True
        if not made_adjustment:
            self.stop_sequence_func()

# change outputs to a series of specified states over specified interval of time
class FixedStatusesSequence(Sequence):
    def __init__(self, **kwargs):
        self.required_args = ['total_time', 'frequency', 'outputs_guide', 'pin_controller', 'status_points', 'stop_sequence_func']

        # base class constructor checks for valid inputs, assignment involving inputs should occur after they've been validated
        super().__init__(**kwargs)

        if type(self.status_points) is not list:
            raise ValueError(f'FixedStatusesSequence input status_points must be list, found: {type(self.status_points)}')
        if len(self.status_points) < 2:
            raise ValueError(f'FixedStatusesSequence input status_points must have length 2 or greater (start and end points), found: {len(self.status_points)}')
        self.timestep = 1/kwargs['frequency']
    
    def _run(self, elapsed_time):
        if elapsed_time >= self.total_time:
            # assert final state
            for output, channels in self.outputs_guide.items():
                for channel in channels:
                    final_value = self.status_points[len(self.status_points) - 1][output][channel]
                    self._updateChannel(output, channel, final_value)
            self.stop_sequence_func()
        else:
            sequence_progress = elapsed_time / self.total_time * (len(self.status_points) - 1)
            current_leg = math.floor(sequence_progress)
            leg_progress = sequence_progress - current_leg

            for output, channels in self.outputs_guide.items():
                for channel in channels:
                    leg_start_value = self.status_points[current_leg][output][channel]
                    leg_end_value = self.status_points[current_leg + 1][output][channel]
                    diff = leg_end_value - leg_start_value
                    current_value = leg_start_value + (diff * leg_progress)
                    self._updateChannel(output, channel, current_value)
