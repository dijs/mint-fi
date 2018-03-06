const groupBy = require('lodash/groupBy');
const identity = require('lodash/identity');
const sortBy = require('lodash/sortBy');
const get = require('lodash/get');

function parseTransaction([date,,,amount, type, category]) {
  if (!date) {
    return null;
  }
  const [month, day, year] = date.split(/\//);
  return {
    date: `${month}/${year}`,
    amount: parseFloat(amount),
    category: category ? category.toLowerCase() : '',
    type
  };
}

function parseCsv(text) {
  return text.substring(1, text.length - 1).split('","');
}

function byType(transactions) {
  return transactions.reduce((types, transaction) => {
    const {type, category, amount} = transaction;
    const sum = get(types, ['type', category], 0);
    if (!types[type]) return types;
    types[type][category] = sum + amount;
    return types;
  }, {
    credit: {},
    debit: {}
  });
}

function sumByKey(obj, key) {
  return Object.keys(obj[key]).reduce((sum, value) => {
    return sum + obj[key][value];
  }, 0);
}

module.exports.byRemovingCategories = (...categories) => {
  return transaction => {
    return !categories.includes(transaction.category);
  };
}

module.exports.removeHeaders = (text) => {
  return text.substring(text.indexOf('\n') + 1);
}

module.exports.parseTransactions = (text) => {
  return text.split('\n')
    .map(parseCsv)
    .map(parseTransaction)
    .filter(identity);
}

module.exports.monthlySummary = (transactions) => {
  const months = groupBy(transactions, 'date');
  return Object.keys(months).reduce((summary, key) => {
    const monthlyTransactions = months[key];
    summary[key] = byType(monthlyTransactions);
    return summary;
  }, {});
}

function totalDebit(summary) {
  return sumByKey(summary, 'debit');
}

module.exports.totalDebit = totalDebit;

const totalCredit = (summary) => {
  return sumByKey(summary, 'credit');
}

module.exports.totalCredit = totalCredit;

module.exports.emergencyFund = (n, months = 6) => {
  return n * months;
}

const requiredSavings = (n, interest = 0.04) => {
  return n / (interest / 12);
}

module.exports.requiredSavings = requiredSavings;

const possibleSavings = (summary) => {
  return totalCredit(summary) - totalDebit(summary);
}

module.exports.possibleSavings = possibleSavings;

const monthsTillFI = (expenses, savings, interest) => {
  return requiredSavings(expenses, interest) / savings;
}
module.exports.monthsTillFI = monthsTillFI

module.exports.fiTimes = (summary, interest) => {
  const savings = possibleSavings(summary);
  const times = Object.keys(summary.debit).map(category => {
    return {
      time: monthsTillFI(summary.debit[category], savings, interest),
      name: category
    };
  });
  return sortBy(times, ({time}) => -time);
}

module.exports.fiRelativeTimes = (times) => {
  const total = times.reduce((sum, category) => sum + category.time, 0);
  return times.map(({time, name}) => {
    return {
      time: time / total,
      name
    };
  });
}
