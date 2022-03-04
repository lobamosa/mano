import { dayjsInstance } from './services/date';

const isNullOrUndefined = (value) => {
  if (typeof value === 'undefined') return true;
  if (value === null) return true;
  return false;
};

// These validators work only for Excel import.
// Todo: move this out out of utils and explain their scope.
const validateString = ({ v: value }) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof `${value}` === 'string') return `${value}`;
  return null;
};

const validateNumber = ({ v: value }) => {
  if (!isNaN(value)) return value;
  if (!isNaN(parseInt(value, 10))) return parseInt(value, 10);
  return null;
};

const validateDate = ({ w: value }) => {
  // https://stackoverflow.com/a/643827/5225096
  if (typeof value?.getMonth === 'function' || value instanceof dayjsInstance) return value;
  if (!isNaN(new Date(value).getMonth())) return new Date(value);
  return null;
};

const validateYesNo =
  (possibleValues = ['Oui', 'Non']) =>
  ({ v: value }) => {
    value = validateString({ v: value });
    if (!value) return null;
    if (possibleValues.includes(value)) return value;
    if (value === 'No') return 'Non';
    if (value === 'Yes') return 'Oui';
    return null;
  };

const validateEnum =
  (possibleValues = []) =>
  ({ v: value }) => {
    value = validateString({ v: value });
    if (!value) return null;
    if (possibleValues.includes(value)) return value;
    return null;
  };

const validateMultiChoice =
  (possibleValues = []) =>
  ({ v: value }) => {
    // value is either string or array
    if (!Array.isArray(value)) {
      value = validateString({ v: value });
      if (!value) return null;
      value = value.split(',');
    }
    value = value.filter((value) => possibleValues.includes(value));
    if (value.length) return value;
    return null;
  };

const validateBoolean = ({ v: value }) => {
  if (typeof value === 'undefined') return null;
  // We have to handle the case where value is a string (cf: import XLSX users).
  if (typeof value === 'string') {
    if (['true', 'oui', 'yes'].includes(value.toLowerCase())) return true;
    if (['false', 'non', 'no'].includes(value.toLowerCase())) return false;
  }
  return Boolean(value);
};

const typeOptions = [
  { value: 'text', label: 'Texte', validator: validateString },
  { value: 'textarea', label: 'Zone de texte multi-lignes', validator: validateString },
  { value: 'number', label: 'Nombre', validator: validateNumber },
  { value: 'date', label: 'Date sans heure', validator: validateDate },
  { value: 'date-with-time', label: 'Date avec heure', validator: validateDate },
  { value: 'yes-no', label: 'Oui/Non', validator: validateYesNo },
  { value: 'enum', label: 'Choix dans une liste', validator: validateEnum },
  { value: 'multi-choice', label: 'Choix multiple dans une liste', validator: validateMultiChoice },
  { value: 'boolean', label: 'Case à cocher', validator: validateBoolean },
];

// Download a file in browser.
function download(file, fileName) {
  if (window.navigator.msSaveOrOpenBlob) {
    //IE11 & Edge
    window.navigator.msSaveOrOpenBlob(file, fileName);
  } else {
    //Other browsers
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
}

export {
  download,
  typeOptions,
  isNullOrUndefined,
  validateString,
  validateNumber,
  validateDate,
  validateYesNo,
  validateEnum,
  validateMultiChoice,
  validateBoolean,
};
