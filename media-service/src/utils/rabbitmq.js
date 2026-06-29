import amqp from "amqplib";
import logger from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

export async function connectTORabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });

    logger.info("Connected to RabbitMQ");

    return channel;
  } catch (error) {
    logger.error("Error durring connecting to RabbitMQ : ", error);

    throw error;
  }
}

export async function publishEvent(routingKey, message) {
  try {
    if (!channel) await connectTORabbitMQ();

    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
    );

    logger.infor(`Event published at : ${routingKey}`);
  } catch (error) {
    logger.error("Error occured during Publishing to RabbitMQ : ", error);

    throw error;
  }
}

export async function consumeEvent(routingKey, callback) {
  if (!channel) await connectTORabbitMQ();

  const q = await channel.assertQueue("", { exclusive: true });

  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

  channel.consume(q.queue, (msg) => {
    if (msg != null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });

  logger.info("Subscribed to event : ", routingKey);
}
