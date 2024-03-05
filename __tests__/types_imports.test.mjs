import { garmin_handler } from '../garmin_handler.mjs'; 
import { TrainingSessionGarmin } from '../training_session.mjs';

describe('Function Type Checks', () => {
    it('should verify that garmin_handler is a function', () => {
      // Check if garmin_handler is of type 'function'
      expect(typeof garmin_handler).toBe('function');
    });
});

describe('TrainingSessionGarmin Constructor and Method Checks', () => {
  it('should verify that TrainingSessionGarmin can be instantiated with mock data', () => {
    // Mock the input data structure required by the TrainingSessionGarmin constructor
    const mockData = {
      userId: 'garmin-user-id',
      activityId: 'some-activity-id',
      summary: {
        activityName: 'Running',
        startTimeInSeconds: 1615123456,
        startTimeOffsetInSeconds: 0,
        activityType: 'RUNNING'
      },
    };
    const mockUserId = 'user-id-retrieved-from-mapping'; 

    // Attempt to instantiate TrainingSessionGarmin with mock data
    let instance;
    expect(() => {
      instance = new TrainingSessionGarmin(mockData, mockUserId);
    }).not.toThrow();

    // Verify that the instance is correctly initialized
    expect(instance).toBeDefined();
    expect(instance.user_id).toEqual(mockUserId);

    if (instance.prepare_event_bridge_params) {
      expect(typeof instance.prepare_event_bridge_params).toBe('function');
    }
  });
});
