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
        profitAmount: { type: Number, default: 0, min: 0 }
      }
    ],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

InvestmentSchema.pre("save", function (next) {
  this.investors.forEach(investor => {
    if (investor.profit === undefined || investor.profit === null) {
      investor.profit = this.expectedProfit; // Set only if not already set
    }
  });
  next();
});



module.exports = mongoose.model("Investment", InvestmentSchema);
