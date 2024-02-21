// garmin_handler.mjs
import AWS from 'aws-sdk';
import https from 'https';
import { TrainingSessionGarmin } from './training_session.mjs';

AWS.config.update({region: 'eu-west-2'}); 
const event_bridge = new AWS.EventBridge({ apiVersion: '2015-10-07' });
const dynamo_db = new AWS.DynamoDB.DocumentClient();
const user_id_cache = {};

async function get_user_id(user_id_garmin) {
    console.log("Getting user ID for Garmin user ID:", user_id_garmin);
    const url = `https://f53aet9v26.execute-api.eu-west-2.amazonaws.com/dev_1/get-user-id?partner=garmin&partner_user_ids=${user_id_garmin}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed_data = JSON.parse(data);
                    const user_ids = parsed_data.user_ids;
                    if (user_ids) {
                        const user_id_array = user_ids.split(',');
                        const user_id = user_id_array[0];
                        resolve(user_id);
                    } else {
                        console.error("User ID not found in the response.");
                        reject(new Error("User ID not found in the response."));
                    }
                } catch (error) {
                    console.error("Parsing error:", error);
                    reject(error);
                }
            });
        }).on('error', (e) => {
            console.error("HTTP request error:", e);
            reject(e);
        });
    });
}

async function garmin_handler(request_body) {
    // No need to try-catch for parsing, as Express already parsed the body
    if (!request_body.activityDetails || !Array.isArray(request_body.activityDetails)) {
        console.error("Invalid request format: 'activityDetails' is missing or not an array");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid request format" }),
        };
    }

    for (const activity of request_body.activityDetails) {
        const user_id_garmin = activity.userId;
        if (!user_id_garmin) {
            console.error("userId is missing in the payload.");
            continue; // Skip this activity and move to the next
        }

        let user_id = user_id_cache[user_id_garmin];
        if (!user_id) {
            user_id = await get_user_id(user_id_garmin);
            user_id_cache[user_id_garmin] = user_id; // Store in cache
        } else {
            console.log("Found user_id in cache");
        }

        console.log("User ID:", user_id);
        const session = new TrainingSessionGarmin(activity, user_id);
        const event_params = session.prepare_event_bridge_params();
        const dynamo_params_log = session.prepare_dynamo_db_params('trainings_log');
        const dynamo_params_aggregates = session.prepare_dynamo_db_aggregate_params('trainings_aggregates');

        try {
            await event_bridge.putEvents(event_params).promise();
            console.log("Event published to EventBridge successfully.");

            await dynamo_db.put(dynamo_params_log).promise();
            console.log("Data inserted into DynamoDB trainings log successfully.");

            await dynamo_db.update(dynamo_params_aggregates).promise();
            console.log("Data inserted into DynamoDB trainings aggregates successfully.");

        } catch (error) {
            console.error("Error processing data:", error);
            // Consider how you want to handle partial failures within the loop
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Processed successfully" }),
    };
};

export { garmin_handler };