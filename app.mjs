import express from 'express';
import { garmin_handler } from './garmin_handler.mjs';
import { sendSubjParamsToCoaching, updateSubjParamsInDb } from './utils.mjs';
import { DynamoDBClient } from "@aws-sdk/lib-dynamodb";
const dynamodbClient = new DynamoDBClient({ region: 'eu-west-2' });

const app = express();
app.use(express.json({ limit: '200mb' }));

// POST endpoint that uses the garmin_handler
app.post('/update/garmin', (req, res) => {
    // Immediately respond to the request
    res.status(200).send({ message: "Processing started" });

    // Process the request body asynchronously
    console.log("Starting garmin_handler with request body:", req.body);
    garmin_handler(req.body).then(response => {
        console.log("Processing completed successfully:", response);
    }).catch(error => {
        console.error("Error during processing JSON:", error);
    });
});

app.post('/subjparams', (req, res) => {
    // Immediately respond to the request
    res.status(200).send({ message: "Processing started" });

    // Process the request body asynchronously
    console.log("Starting insertion of subjective parameters with request body:", req.body);
    sendSubjParamsToCoaching(req.body.userId, req.body.sessionId, req.body.perceivedExertion, req.body.perceivedRecovery, req.body.perceivedTrainingSuccess).then(response => {
        console.log("Processing completed successfully:", response);
    }).catch(error => {
        console.error("Error sending subjective params to coaching:", error);
    });
    updateSubjParamsInDb(dynamodbClient, req.body.userId, req.body.sessionId, req.body.perceivedExertion, req.body.perceivedRecovery, req.body.perceivedTrainingSuccess).then(response => {
        console.log("Processing completed successfully:", response);
    }).catch(error => {
        console.error("Error inserting subjective params to DB:", error);
    });    
});

// Health check endpoint
app.get('/health', (req, res) => {
    // Respond with 200 OK and a status message
    res.status(200).send({ status: 'Healthy' });
});

// Listen on port 80
app.listen(80, () => {
    console.log('Server running on port 80');
});