const mongoose = require("mongoose");

const InvestmentSchema = new mongoose.Schema(
  {
    material: { type: String, required: true },
    description: { type: String },
    minInvestment: { type: Number, required: true, min: 0 },
    expectedProfit: { type: Number, required: true, min: 0 },
    totalInvestment: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    investors: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true, min: 0 },
        profit: { type: Number, min: 0 }, // Default profit set to 0
      }
    ],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

InvestmentSchema.pre("save", function (next) {
  this.investors.forEach(investor => {
    investor.profit = this.expectedProfit; // Sync profit with expectedProfit
  });
  next();
});
module.exports = mongoose.model("Investment", InvestmentSchema);
