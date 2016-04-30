require('should');

var Utils = require('../dist/utils');

var data = '"4/25/2016","Tom Thumb","TOM THUMB","41.25","debit","Food","Blue Cash Preferred SM","",""\n' +
  '"4/26/2016","A","A","100","debit","Utility","Checking Account","",""\n' +
  '"4/27/2016","A","B","5.60","debit","Snack","Credit Card","",""\n' +
  '"4/28/2016","JOB","JOB JOB","500.60","credit","Income","Checking Account","",""';

describe('Mint -> FI', function () {

  const transactions = Utils.parseTransactions(data);
  const summary = Utils.monthlySummary(transactions)['4/2016'];
  const totalExpenses = Utils.totalDebit(summary);
  const savings = Utils.possibleSavings(summary);
  const times = Utils.fiTimes(summary);

  it('should remove headers from csv', function () {
    Utils.removeHeaders('hello,world\n1,2').should.equal('1,2');
  });

  it('should parse transactions', function () {
    transactions[0].should.be.eql({
      date: '4/2016',
      category: 'food',
      type: 'debit',
      amount: 41.25
    });
  });

  it('should calculate monthly summary', function () {
    summary.credit.should.have.property('income', 500.6);
    summary.debit.should.have.property('food', 41.25);
  });

  it('should calculate emergency fund', function () {
    Utils.emergencyFund(totalExpenses).should.be.above(881).and.below(882);
  });

  it('should calculate savings needed to pay for expenses with interest', function () {
    Utils.requiredSavings(totalExpenses).should.be.above(44054.99).and.below(44055);
  });

  it('should calculate months needed to get to FI', function () {
    Utils.monthsTillFI(summary.debit.food, savings).should.be.above(34).and.below(35);
  });

  it('should calculate FI values from summary', function () {
    times[1].name.should.equal('food');
    times[1].time.should.be.above(34).and.below(35);
  });

  it('should calculate FI relative times', function () {
    const relTimes = Utils.fiRelativeTimes(times);
    relTimes[0].time.should.be.above(0.68).and.below(0.69);
  });

});
