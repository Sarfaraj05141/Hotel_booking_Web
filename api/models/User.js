const mongoose=require('mongoose')
const{Schema}=mongoose

const UserSchecma=new Schema({
    name:String,
    email:{type:String ,unique:true},
    password:String,
})

const UserModel=mongoose.model('User',UserSchecma)

module.exports=UserModel;