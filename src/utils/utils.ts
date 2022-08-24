/**
 * strips leading and trailing spaces,
 * converts to lowercase,
 * join spaces with '-'
 * @param {string} str - string to be slugified
 * @returns {string} - slugified string
 */
export const stripAndHyphenate = (str: string): string => {
  return str.trim().toLowerCase().replace(/\s+/g, '-');
};

/**
 * Given a comma separated string, returns an array of strings
 * @param {string} str - comma separated string
 * @returns {string[]} - array of strings
 */
export const commaSeparatedStringToArray = (str: string): string[] => {
  return str.split(',').map((s) => s.trim());
};

/**
 * M-Pesa required timestamp format
 * @returns {string} - timestamp in the format YYYYMMDDHHmmss (e.g 20220603103422)
 */
export const mPesaTimeStamp = (): string => {
  // if month, day, hour, minute, second are less than 10 pad with a 0
  const year = new Date().getFullYear();
  let month: string | number = new Date().getMonth();
  month = month < 10 ? `0${month}` : month;

  let day: string | number = new Date().getDay();
  day = day < 10 ? `0${day}` : day;

  let hour: string | number = new Date().getHours();
  hour = hour < 10 ? `0${hour}` : hour;

  let minute: string | number = new Date().getMinutes();
  minute = minute < 10 ? `0${minute}` : minute;

  let second: string | number = new Date().getSeconds();
  second = second < 10 ? `0${second}` : second;

  return `${year}${month}${day}${hour}${minute}${second}`;
};
