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
      prepare_coaching_params: jest.fn()
    };
    // Return the constructor mock
    return {
      TrainingSessionGarmin: jest.fn().mockImplementation(() => mockMethods),
    };
  });

// example request body
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

global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({ success: true }) // Mock successful response
}));

describe('Garmin Handler Functionality', () => {
    // Testing the handler's response to a valid request
    it('responds successfully to valid activity details', async () => {
      const response = await garmin_handler(mockRequestBody);
  
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: "Processed successfully" })
      });
    });
  
    // Testing interaction with external dependencies for a valid request
    it('interacts correctly with external services on valid activity details', async () => {
      await garmin_handler(mockRequestBody);
  
      // Verifies interaction with https module to fetch user ID
      expect(https.get).toHaveBeenCalled();
      // Checks if EventBridgeClient and commands were utilized
      expect(EventBridgeClient).toHaveBeenCalled();
      expect(PutEventsCommand).toHaveBeenCalled();
      // Verifies DynamoDB DocumentClient interactions
      expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
    });
  });
  
describe('TrainingSessionGarmin Class Behavior', () => {
    beforeEach(async () => {
      await garmin_handler(mockRequestBody);
    });
  
    it('is instantiated correctly for each activity detail', () => {
      expect(TrainingSessionGarmin).toHaveBeenCalled();
    });
  
    it('calls instance methods as expected for event preparation', () => {
      const mockMethodsUsed = TrainingSessionGarmin.mock.results[0].value;
      // Verify that each method required for preparing the event data is called
      expect(mockMethodsUsed.prepare_event_bridge_params).toHaveBeenCalled();
      expect(mockMethodsUsed.prepare_dynamo_db_log_params).toHaveBeenCalled();
      expect(mockMethodsUsed.prepare_dynamo_db_aggregate_params).toHaveBeenCalled();
    });
  });
  

describe('Error testing', () => {

  it('should return error for invalid request body', async () => {
    const invalidRequestBody = {
      invalidKey: []
    };
  
    const response = await garmin_handler(invalidRequestBody);
  
    expect(response).toEqual({
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid request format: 'activityDetails' is missing or not an array" })
    });
  });
    it('should return error for missing userId', async () => {
        const invalidRequestBody = {
        activityDetails: [
            {
            activityType: 'Cycling',
            startTime: '2023-03-01T12:00:00Z',
            duration: 3600,
            distance: 15000,
            calories: 500,
            },
        ]
        };
    
        const response = await garmin_handler(invalidRequestBody);
    
        expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: "userId is missing in the payload." })
        });
    });  
});
