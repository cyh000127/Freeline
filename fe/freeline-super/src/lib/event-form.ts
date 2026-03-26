export const EVENT_FORM_LIMITS = {
  name: 100,
  description: 200,
  locationAddress: 200,
  policyMax: 10000,
} as const;

export const getTodayDateString = () => new Date().toISOString().slice(0, 10);

export const EVENT_INPUT_BASE_CLASS =
  "w-full rounded-2xl p-4 text-[15px] text-gray-900 transition-all outline-none";

export const EVENT_INPUT_NORMAL_CLASS =
  "bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#2D2A4A] focus:bg-white";

export const EVENT_INPUT_ERROR_CLASS =
  "bg-[#FFF5F5] ring-1 ring-red-400 focus:ring-2 focus:ring-red-400";

export const getEventInputClassName = (hasError: boolean, extraClassName = "") =>
  `${EVENT_INPUT_BASE_CLASS} ${hasError ? EVENT_INPUT_ERROR_CLASS : EVENT_INPUT_NORMAL_CLASS} ${extraClassName}`.trim();

export const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

export const parsePolicyValue = (value: string) => {
  const digitsOnly = sanitizeDigits(value);

  if (digitsOnly === "") {
    return 0;
  }

  return Math.min(Number(digitsOnly), EVENT_FORM_LIMITS.policyMax);
};
