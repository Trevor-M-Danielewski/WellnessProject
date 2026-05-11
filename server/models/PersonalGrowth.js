const mongoose = require('mongoose')

const GoalSchema = new mongoose.Schema({
    goalText:String,
    done:{type:Boolean, default:false}
})

const HabitSchema = new mongoose.Schema({
    name:String
})

const PersonalGrowthSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'users', required:true},
    goals:[GoalSchema],
    habits:[HabitSchema],
    progress:{type:String, required:true},
    motivationalNote:{type:String, default:''},
    date:{type:Date, default:Date.now}
})

const PersonalGrowthModel = mongoose.model("personalgrowth", PersonalGrowthSchema)

module.exports = PersonalGrowthModel
