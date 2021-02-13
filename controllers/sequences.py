'''
    File for storing all controller sequences
    Sequences control output thru a designated pattern, either:
        - to an end state or
        - over an infitie pattern
    Sequences should be as generic as possible
        - specific entries the config should call one with params

    TO DO: 
        1. add available and active sequences to status
        2. make a few more sequences to prove design
        3. add to frontend
'''

import time
import math
import threading

class Sequence:

    # all kwargs are created as class vars
    def __init__(self, **kwargs):
        base_required_args = ['pin_controller']

        # check that required args are provided
        if not self.required_args or self.required_args == None:
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
        self.sequence_run_inst = NonBlockingSequenceRun()
        run_thread = threading.Thread(target = self.sequence_run_inst.run_sequence, args = (self._run, self.timestep))
        run_thread.start()

        # demo of how to stop threads
        # time.sleep(5)
        # self._close()

    # private methods for iteration, should be overridden
        # elapsed time is param b/c specified by NonBlockingSequenceRun inst
    def _run(self, elapsed_time):
        raise NotImplementedError(f'sequence {self.__class__.__name__} not fully implemented: missing self._run()')

    # private method for updating channel intensities
    def _updateChannel(self, output, channel, intensity):
        self.pin_controller.setPin(output, channel, intensity)

    # private closesout methods for sequence kill/stop, should be overridden
    def _close(self):
        self.sequence_run_inst.stop()
        print('stopped thread')

    # static method for initializing a zero'd sequenc state of all channel intensities
        # outputs guide format: {output_1: [channel_1, ...], ...}
    def _initState(outputs_guide):
        state = {}
        for output, channels in outputs_guide.items():
            state[output] = {}
            for ch in channels:
                state[output][ch] = 0
        return state

# helper class to call sequence loop in a stoppable, non-blocking thread
class NonBlockingSequenceRun:
    def __init__(self):
        self.running = True
        self.start_time = time.time()
    
    def run_sequence(self, sequence_run_func, timestep):
        while self.running:
            self.elapsed_time = time.time() - self.start_time
            sequence_run_func(self.elapsed_time)
            time.sleep(timestep)

    def stop(self):
        self.running = False

# cycle all channels together inputs together
class CycleSequence(Sequence):
    def __init__(self, **kwargs):
        self.required_args = ['period', 'frequency', 'outputs_guide']
        
        # base class constructor checks for valid inputs, assignment involving inputs should occur after they've been validated
        super().__init__(**kwargs)
        
        self.timestep = 1/kwargs['frequency']
        # self.state = Sequence._initState(kwargs['outputs_guide'])

    def _run(self, elapsed_time):
        intensity = 100*(-0.5*math.cos((elapsed_time/self.period) * 2*math.pi) + 0.5)
        for output, channels in self.outputs_guide.items():
            for ch in channels:
                self._updateChannel(output, ch, intensity)