// Baths for Self-Repair Arc 1.
// Currently only lesson 1.1 has written content; others are MBT (0 min) by default.

export type SelfRepairLessonBath = {
  code: string;
  title: string;
  minutes: number;
};

export const selfRepairBaths: Record<string, SelfRepairLessonBath> = {
  "1.1": {
    code: "1.1",
    title: "Mapping Your Current Rhythm (Sleep, Food, Energy)",
    minutes: 30,
  },
};
