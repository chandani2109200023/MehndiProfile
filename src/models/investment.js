const mongoose = require("mongoose");

const InvestmentSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    description: { type: String },
    minInvestment: { type: Number, required: true, min: 0 },
    expectedProfit: { type: Number, required: true, min: 0 },
    totalInvestment: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, required: true, min: 0 }, // Cost price per unit
    costQuantity: { type: Number, required: true, min: 0 }, // Total cost quantity
    sellingPrice: { type: Number, default: 0, min: 0 }, // Selling price per unit (default to 0)
    sellingQuantity: { type: Number, default: 0, min: 0 }, // Total selling quantity (default to 0)
    investors: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true, min: 0 },
        profit: { type: Number, min: 0 }, // Default profit set to 0
        profitAmount: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, default: 0 }, // Field to store totalAmount
      }
    ],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

// Pre-save middleware to update investors and remove zero amounts
InvestmentSchema.pre("save", function (next) {
  // Iterate over the investors and perform necessary actions
  this.investors = this.investors.filter(investor => investor.amount > 0); // Remove investors with amount 0

  this.investors.forEach(investor => {
    // Set profit to expectedProfit if it is not already set
    if (investor.profit === undefined || investor.profit === null) {
      investor.profit = this.expectedProfit;
    }
    // Calculate totalAmount for each investor
    investor.totalAmount = investor.amount + investor.profitAmount;
  });

  next();
});

// Pre-update middleware to update totalAmount of investors
InvestmentSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const investment = await this.model.findOne(this.getQuery());

  if (investment) {
    const updatedInvestors = investment.investors.map(investor => {
      if (update.$set && update.$set['investors.$[elem]']) {
        const investorData = update.$set['investors.$[elem]'];
        if (investor.userId.toString() === investorData.userId.toString()) {
          // Update totalAmount based on the new amount or profitAmount
          investor.totalAmount = investorData.amount + investorData.profitAmount;
        }
      }
      return investor;
    });

    // Update the investors in the investment document
    investment.investors = updatedInvestors;
    await investment.save();
  }
  next();
});

module.exports = mongoose.model("Investment", InvestmentSchema);
