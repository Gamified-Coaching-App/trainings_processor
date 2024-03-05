import { TrainingSessionGarmin } from '../training_session.mjs';

describe('TrainingSessionGarmin Class', () => {
  describe('convert_to_local_time', () => {
    it('correctly converts UTC seconds and offset to local time', () => {
      const utcSeconds = 1625068800; // Example UTC seconds
      const offsetInSeconds = 3600; // Example offset (1 hour)
      const expectedLocalTime = utcSeconds + offsetInSeconds;

      expect(TrainingSessionGarmin.convert_to_local_time(utcSeconds, offsetInSeconds)).toEqual(expectedLocalTime);
    });
  });

  describe('prepare_event_bridge_params', () => {
    it('returns correct EventBridge parameters', () => {
      // Test for the key functionality of the prepare_event_bridge_params method
      const data = {
        activityId: 123, 
        summary: {
          activityName: 'Running',
          startTimeInSeconds: 1625068800,
          activityType: 'RUNNING',
          distanceInMeters: 4567
        }
      };
      const user_id = 'user123';
  
      // Create an instance of TrainingSessionGarmin
      const session = new TrainingSessionGarmin(data, user_id);
  
      // Adjusted expected EventBridge parameters to match the corrected activityId
      const expectedParams = {
        Entries: [
          {
            Source: 'com.mycompany.myapp.activities',
            DetailType: 'activity_processed',
            Detail: JSON.stringify({
              user_id: user_id,
              timestamp_local: data.summary.startTimeInSeconds,
              session_id: 123, // Ensure this matches the provided activityId
              activity_type: 'RUNNING',
              distance_in_meters: 4567,
              points_gained: JSON.stringify(session.points_gained)
            }),
            EventBusName: 'default',
          },
        ],
      };
  
      expect(session.prepare_event_bridge_params()).toEqual(expectedParams);
    });
  });  
});
