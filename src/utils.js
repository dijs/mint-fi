import groupBy from 'lodash/groupBy';
import identity from 'lodash/identity';
import sortBy from 'lodash/sortBy';

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
    const sum = types[type][category] || 0;
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

export function byRemovingCategories(...categories) {
  return transaction => {
    return !categories.includes(transaction.category);
  };
}

export function removeHeaders(text) {
  return text.substring(text.indexOf('\n') + 1);
}

export function parseTransactions(text) {
  return text.split('\n')
    .map(parseCsv)
    .map(parseTransaction)
    .filter(identity);
}

export function monthlySummary(transactions) {
  const months = groupBy(transactions, 'date');
  return Object.keys(months).reduce((summary, key) => {
    const monthlyTransactions = months[key];
    summary[key] = byType(monthlyTransactions);
    return summary;
  }, {});
}

export function totalDebit(summary) {
  return sumByKey(summary, 'debit');
}

export function totalCredit(summary) {
  return sumByKey(summary, 'credit');
}

export function emergencyFund(n, months = 6) {
  return n * months;
}

export function requiredSavings(n, interest = 0.04) {
  return n / (interest / 12);
}

export function possibleSavings(summary) {
  return totalCredit(summary) - totalDebit(summary);
}

export function monthsTillFI(expenses, savings, interest) {
  return requiredSavings(expenses, interest) / savings;
}

export function fiTimes(summary, interest) {
  const savings = possibleSavings(summary);
  const times = Object.keys(summary.debit).map(category => {
    return {
      time: monthsTillFI(summary.debit[category], savings, interest),
      name: category
    };
  });
  return sortBy(times, ({time}) => -time);
}

export function fiRelativeTimes(times) {
  const total = times.reduce((sum, category) => sum + category.time, 0);
  return times.map(({time, name}) => {
    return {
      time: time / total,
      name
    };
  });
}
