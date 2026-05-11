const mongoose = require('mongoose')

const SleepJournalSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'users', required:true},
    bedtime:{type:String, required:true},
    waketime:{type:String, required:true},
    duration:{type:String},
    quality:{type:String, required:true},
    restfulness:{type:Number},
    notes:{type:String, default:''},
    date:{type:Date, default:Date.now}
})

const SleepJournalModel = mongoose.model("sleepjournals", SleepJournalSchema)

module.exports = SleepJournalModel