/**
 * PromptPay EMVCo QR Code Payload Generator
 * References:
 * - https://www.blognone.com/node/95133
 * - https://www.emvco.com/emv-technologies/qrcodes/
 */

const ID_PAYLOAD_FORMAT = '00';
const ID_POI_METHOD = '01';
const ID_MERCHANT_INFORMATION_BOT = '29';
const ID_TRANSACTION_CURRENCY = '53';
const ID_TRANSACTION_AMOUNT = '54';
const ID_COUNTRY_CODE = '58';
const ID_CRC = '63';

const PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE = '01';
const POI_METHOD_STATIC = '11';
const POI_METHOD_DYNAMIC = '12';
const MERCHANT_INFORMATION_TEMPLATE_ID_GUID = '00';
const BOT_ID_MERCHANT_PHONE_NUMBER = '01';
const BOT_ID_MERCHANT_TAX_ID = '02';
const BOT_ID_MERCHANT_EWALLET_ID = '03';
const GUID_PROMPTPAY = 'A000000677010111';
const TRANSACTION_CURRENCY_THB = '764';
const COUNTRY_CODE_TH = 'TH';

export function crc16xmodem(str: string): number {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    let code = (crc >>> 8) & 0xff;

    code ^= charCode & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc;
}

function f(id: string, value: string): string {
  return [id, ('00' + value.length).slice(-2), value].join('');
}

function serialize(xs: (string | false | undefined)[]): string {
  return xs.filter(x => x).join('');
}

function sanitizeTarget(id: string): string {
  return id.replace(/[^0-9]/g, '');
}

function formatTarget(id: string): string {
  const numbers = sanitizeTarget(id);
  if (numbers.length >= 13) return numbers;
  return ('0000000000000' + numbers.replace(/^0/, '66')).slice(-13);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatCrc(crcValue: number): string {
  return ('0000' + crcValue.toString(16).toUpperCase()).slice(-4);
}

/**
 * Generates a standard EMVCo PromptPay QR Code Payload string
 * @param target Mobile Phone Number (e.g. 0830131768) or Tax ID / National ID (13 digits)
 * @param amount Optional transfer amount
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  const cleanTarget = sanitizeTarget(target);

  const targetType = (
    cleanTarget.length >= 15 ? (
      BOT_ID_MERCHANT_EWALLET_ID
    ) : cleanTarget.length >= 13 ? (
      BOT_ID_MERCHANT_TAX_ID
    ) : (
      BOT_ID_MERCHANT_PHONE_NUMBER
    )
  );

  const data = [
    f(ID_PAYLOAD_FORMAT, PAYLOAD_FORMAT_EMV_QRCPS_MERCHANT_PRESENTED_MODE),
    f(ID_POI_METHOD, amount ? POI_METHOD_DYNAMIC : POI_METHOD_STATIC),
    f(ID_MERCHANT_INFORMATION_BOT, serialize([
      f(MERCHANT_INFORMATION_TEMPLATE_ID_GUID, GUID_PROMPTPAY),
      f(targetType, formatTarget(cleanTarget))
    ])),
    f(ID_COUNTRY_CODE, COUNTRY_CODE_TH),
    f(ID_TRANSACTION_CURRENCY, TRANSACTION_CURRENCY_THB),
    amount ? f(ID_TRANSACTION_AMOUNT, formatAmount(amount)) : undefined
  ];
  const dataToCrc = serialize(data) + ID_CRC + '04';
  const calculatedCrc = crc16xmodem(dataToCrc);
  data.push(f(ID_CRC, formatCrc(calculatedCrc)));
  return serialize(data);
}
