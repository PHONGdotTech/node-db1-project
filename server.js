const express = require('express');

const db = require('./data/dbConfig.js');

const server = express();

server.use(express.json());

//Create an account
server.post("/", validateBody, (req,res)=>{
    db('accounts').insert(req.body, 'idz')
    .then(id=>{
        res.status(201).json({message: `Successfully added a new account with id of ${id}.`})
    })
    .catch(err=>{
        res.status(500).json({errorMessage: "There was an error adding a new account."})
    })
})

//Read all accounts
server.get("/", (req,res)=>{
    db('accounts')
    .then(accounts =>{
        res.status(200).json(accounts)
    })
    .catch(err=>{
        res.status(500).json({errorMessage: "There was an error getting accounts."})
    })
})

//Read an individual account
server.get('/:id', validateId, (req,res)=>{
    res.status(200).json(req.account)
})

//Update an account
server.put('/:id', validateId, validateBody, (req,res)=>{
    db('accounts').where({id: req.params.id}).update({name: req.body.name, budget: req.body.budget})
    .then(count=>{
        res.status(200).json({message: `Successfully updated ${count} account.`})
    })
    .catch(err=>{
        res.status(500).json({errorMessage: "There was an error updating the account."})
    })
})

//Delete an account
server.delete('/:id', validateId, (req,res)=>{
    db('accounts').where({id: req.params.id}).del()
    .then(count=>{
        res.status(200).json({message: `Successfully deleted ${count} account.`})
    })
    .catch(err=>{
        res.status(500).json({errorMessage: "There was an error deleting the account."})
    })
})

///////////////////////
//middleware functions
///////////////////////

//validates ID to make sure it exists
function validateId(req, res, next){
    db('accounts').where({id: req.params.id})
    .first()
    .then(account=>{
        !account ?
        res.status(404).json({message:`No user with id ${req.params.id} exists.`}) :
        (req.account = account, next())
    })
    .catch(err=>{
        res.status(500).json({errorMessage: "There was an error getting that account."})
    })
}

//validates request body for existence, required keys, and a unique name. crazy nested if-elses
function validateBody(req, res, next){
    Object.keys(req.body).length === 0 && req.body.constructor === Object ?
    res.status(400).json({message:"Missing request body."}) :
        !req.body.name || !req.body.budget || req.body.budget.constructor === String ?
        res.status(400).json({message: "name and budget are required. name is a string, budget is a number"}) :
            db('accounts').where({name: req.body.name})
            .first()
            .then(account=>{
                !account ? next() : 
                    //does the request params id exist and does it equal the current account id?
                    //if yes: that means we are updating the account and continue with next()
                    //if no: that means there is another account with the same name
                    req.params.id && parseInt(req.params.id) === account.id ? next() :
                    res.status(400).json({message:"name is currently in use by another account. please change name"})
            })
            .catch(err=>{
                res.status(500).json({message:"Couldn't compare that account name to stored name."})
            })
}

module.exports = server;