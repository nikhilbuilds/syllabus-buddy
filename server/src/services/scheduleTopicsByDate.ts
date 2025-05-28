import moment from "moment";
import { Topic } from "../models/Topic";

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
  let currentDate = moment(startDate);
  let currentDayTime = 0;

  for (const topic of topics) {
    const topicTime = topic.estimatedTimeMinutes;

    if (currentDayTime + topicTime > dailyLimit) {
      // move to next day
      currentDate.add(1, "day");
      currentDayTime = 0;
    }

    topic.assignedDate = currentDate.toDate();
    currentDayTime += topicTime;

    scheduledTopics.push(topic);
  }

  return scheduledTopics;
};
