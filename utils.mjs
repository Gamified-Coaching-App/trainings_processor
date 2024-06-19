async function sendSubjParamsToCoaching(userId, sessionId, perceivedExertion, perceivedRecovery, perceivedTrainingSuccess) {
    const endpoint = 'http://Coachi-Coach-bgtKlzJd2GCw-908383528.eu-west-2.elb.amazonaws.com/subjparams';
    const params = {
        userId: userId,
        sessionId: sessionId,
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

async function updateSubjParamsInDb(dynamoDbClient, userId, sessionId, perceivedExertion, perceivedRecovery, perceivedTrainingSuccess) {
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
        const result = await dynamoDbClient.update(params).promise();
        console.log('Successfully updated subjective parameters', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

export { sendSubjParamsToCoaching, updateSubjParamsInDb };
