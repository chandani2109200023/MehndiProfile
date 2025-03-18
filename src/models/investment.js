const mongoose = require("mongoose");

const InvestmentSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    description: { type: String },
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
        totalAmount: { type: Number }, // No default value here
      }
    ],
    images: [{ type: String }], 
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
    // Calculate totalAmount for each investor dynamically
    investor.totalAmount = investor.amount + investor.profitAmount;
  });

  next();
});

module.exports = mongoose.model("Investment", InvestmentSchema);
