import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import jwt from 'jsonwebtoken';

async function sendSubjParamsToCoaching(data) {
    const { userId, timestampLocal, sessionId, perceivedExertion, perceivedRecovery, perceivedTrainingSuccess } = data;
    const endpoint = 'http://Coachi-Coach-bgtKlzJd2GCw-908383528.eu-west-2.elb.amazonaws.com/subjparams';
    const params = {
        userId: userId,
        sessionId: sessionId,
        timestampLocal: timestampLocal.slice(0,10),
        perceivedExertion: perceivedExertion,
        perceivedRecovery: perceivedRecovery,
        perceivedTrainingSuccess: perceivedTrainingSuccess
    };
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateSubjParamsInDb(dynamoDbClient, data) {
    const { userId, sessionId, perceivedExertion, perceivedRecovery, perceivedTrainingSuccess } = data;

    const params = {
        TableName: 'trainings_log',
        Key: {
            'user_id': userId,
            'session_id': sessionId
        },
        UpdateExpression: `
            SET 
                perceived_exertion = :perceivedExertion,
                perceived_recovery = :perceivedRecovery,
                perceived_training_success = :perceivedTrainingSuccess
        `,
        ExpressionAttributeValues: {
            ':perceivedExertion': perceivedExertion !== null ? perceivedExertion : -0.1,
            ':perceivedRecovery': perceivedRecovery !== null ? perceivedRecovery : -0.1,
            ':perceivedTrainingSuccess': perceivedTrainingSuccess !== null ? perceivedTrainingSuccess : -0.1
        },
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        const command = new UpdateCommand(params);
        const result = await dynamoDbClient.send(command);
        console.log('Successfully updated subjective parameters', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

function getUserIdFromJwt(token) {
    const decoded = jwt.decode(token);
    return decoded.sub;
}

export { sendSubjParamsToCoaching, updateSubjParamsInDb, getUserIdFromJwt };
