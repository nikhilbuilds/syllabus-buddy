import moment from "moment";
import { Topic } from "../models/Topic";
import { LoggingService } from "./logging.service";
import { LogLevel, LogSource } from "../models/Log";

interface ScheduleParams {
  topics: Topic[];
  startDate: Date;
  dailyLimit: number;
}

/**
 * Schedules topics across calendar dates based on estimated time and daily limit.
 */
export const scheduleTopicsByDate = ({
  topics,
  startDate,
  dailyLimit,
}: ScheduleParams): Topic[] => {
  const scheduledTopics: Topic[] = [];
  // Use UTC for consistent date handling
  let currentDate = moment.utc(startDate).startOf("day");
  let currentDayTime = 0;

  console.log("Scheduling with params:", {
    startDate: currentDate.format(),
    dailyLimit,
    totalTopics: topics.length,
  });

  for (const topic of topics) {
    const topicTime = topic.estimatedTimeMinutes || 0;

    console.log("Current day time:", currentDayTime);
    console.log("Topic time:", topicTime);
    console.log("Daily limit:", dailyLimit);

    // If adding this topic would exceed daily limit, move to next day
    if (currentDayTime + topicTime > dailyLimit) {
      currentDate = currentDate.add(1, "day");
      currentDayTime = 0;
    }

    // Create a new date object for the assigned date
    const assignedDate = currentDate.toDate();
    console.log("Assigning topic:", {
      title: topic.title,
      time: topicTime,
      date: assignedDate,
      dayTime: currentDayTime,
    });

    topic.assignedDate = assignedDate;
    currentDayTime += topicTime;

    scheduledTopics.push(topic);
  }

  return scheduledTopics;
};
