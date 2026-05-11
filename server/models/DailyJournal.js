const mongoose = require('mongoose')

const ActivitySchema = new mongoose.Schema({
    name:String
})

const DailyJournalSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'users', required:true},
    mood:{type:String, required:true},
    restedRating:{type:Number, min:0, max:3},
    journalText:{type:String, default:''},
    activities:[ActivitySchema],
    date:{type:Date, default:Date.now}
})

const DailyJournalModel = mongoose.model("dailyjournals", DailyJournalSchema)

module.exports = DailyJournalModel