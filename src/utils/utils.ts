/**
 * strips leading and trailing spaces,
 * converts to lowercase,
 * join spaces with '-'
 * @param {string} str - string to be slugified
 * @returns {string} - slugified string
 */
export const stripSanitizeAndHyphenate = (str: string): string => {
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
