import 'babel-polyfill';
import {readFileSync} from 'fs';
import {parseTransactions, removeHeaders, byRemovingCategories,
  monthlySummary, totalDebit, fiTimes, totalCredit, fiRelativeTimes, possibleSavings} from './utils';

if (process.argv.length < 3) {
  console.log('Please include your mint transactions csv file as an argument');
  process.exit();
}

console.log(process.argv);
console.log(`Reading data from ${process.argv[2]}`);
const csvData = readFileSync(process.argv[2], 'utf8');

// TODO: These need to be variables as well
const transactions = parseTransactions(removeHeaders(csvData))
  .filter(byRemovingCategories('hide from budgets & trends', 'transfer', 'credit card payment'));
const monthlySummaries = monthlySummary(transactions);
console.log('Using last month by default (will allow you to choose soon)');
// TODO: Be able to choose which month to see info for
const lastMonth = Object.keys(monthlySummaries)[0];
const summary = monthlySummaries[lastMonth];
const totalExpenses = totalDebit(summary);
const income = totalCredit(summary);
const savings = possibleSavings(summary);
const times = fiTimes(summary);
const relTimes = fiRelativeTimes(times);
const fiTimeTotal = times.reduce((sum, category) => sum + category.time, 0);

// TODO: Be able to state current savings account balance

// Printing information
console.log(`FI information for ${lastMonth}`);
console.log('-'.repeat(lastMonth.length));
console.log('Here is a breakdown of FI information:');
times.forEach(({name, time}, index) => {
  console.log();
  console.log(name);
  console.log('-'.repeat(name.length));
  const spent = `Spent: $${Math.round(summary.debit[name])}`;
  const till = `Months till FI: ${Math.round(time)}`;
  const percentage = Math.round(relTimes[index].time * 100);
  const rel = `Percentage of expenses: ${percentage}%`;
  console.log(`${spent}, ${till}, ${rel}`);
});
console.log(`Total income was $${Math.round(income)}`);
console.log(`Total expenses were $${Math.round(totalExpenses)}`);
console.log(`Possible savings were $${Math.round(savings)}`);
console.log(`You are ${Math.round(fiTimeTotal)} months away from FI, that is ${Math.round(fiTimeTotal / 12)} years`);
