// Import the handler function. Adjust the path according to your file structure.
import { garmin_handler } from '../garmin_handler.mjs';
import https from 'https';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TrainingSessionGarmin } from '../training_session.mjs';

// Mocks for AWS SDK
jest.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutEventsCommand: jest.fn(),
  }));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
DynamoDBDocumentClient: {
    from: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({}),
    })),
},
PutCommand: jest.fn(),
UpdateCommand: jest.fn(),
}));

// Mock for https module
jest.mock('https', () => ({
    get: jest.fn().mockImplementation((url, callback) => {
      const mockResponse = {
        on: (event, handler) => {
          if (event === 'data') {
            handler(JSON.stringify({ user_ids: 'mock-user-id' }));
          }
          if (event === 'end') {
            handler();
          }
        }
      };
      callback(mockResponse);
      return { on: jest.fn() };
    })
  }));

  jest.mock('../training_session.mjs', () => {
    // Mock the instance methods
    const mockMethods = {
      prepare_event_bridge_params: jest.fn().mockReturnValue({}),
      prepare_dynamo_db_log_params: jest.fn().mockReturnValue({}),
      prepare_dynamo_db_aggregate_params: jest.fn().mockReturnValue({}),
    };
    // Return the constructor mock
    return {
      TrainingSessionGarmin: jest.fn().mockImplementation(() => mockMethods),
    };
  });


  const mockRequestBody = {
    activityDetails: [
        {
            userId: 'garminUser123', // Simulate a Garmin user ID
            activityType: 'Cycling', // Example activity type
            startTime: '2023-03-01T12:00:00Z', // Example start time in ISO format
            duration: 3600, // Duration of the activity in seconds
            distance: 15000, // Distance covered in meters
            calories: 500, // Calories burned
        },
    ]
};
describe('Garmin Handler Tests', () => {
      
  it('should call https, evenbridge and DynamoDBDocumentClient', async () => {

    const response = await garmin_handler(mockRequestBody);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "Processed successfully" })
    });

    // Verify interactions with mocked dependencies
    expect(https.get).toHaveBeenCalled();
    expect(EventBridgeClient).toHaveBeenCalled(); // Verifies an instance of the EventBridgeClient was created
    expect(PutEventsCommand).toHaveBeenCalled();
    expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
  });
  it('TrainingSessionGarmin called correctly', async () => {

    const response = await garmin_handler(mockRequestBody);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({ message: "Processed successfully" })
    });

    expect(TrainingSessionGarmin).toHaveBeenCalled();

    //console.log('Mock function calls:', TrainingSessionGarmin.mock.calls);
    //console.log('Mock instances:', TrainingSessionGarmin.mock.instances);

    // Verify that the instance methods were called
    const mockMethodsUsed = TrainingSessionGarmin.mock.results[0].value;
    expect(mockMethodsUsed.prepare_event_bridge_params).toHaveBeenCalled();
    expect(mockMethodsUsed.prepare_dynamo_db_log_params).toHaveBeenCalled();
    expect(mockMethodsUsed.prepare_dynamo_db_aggregate_params).toHaveBeenCalled();
  });
  
});
