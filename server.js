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
    // (0) If req.query has no keys and is an object (meaning it's empty)
    // then: just get all accounts
    if (Object.keys(req.query).length === 0 && req.query.constructor === Object){
        db('accounts')
        .then(accounts =>{
            res.status(200).json(accounts)
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "There was an error getting accounts."})
        })
    } 
    // (3) If req.query has a limit, sortby, and sortdir, and sortby and sortdir are verified
    // then: show all accounts, sort them, and limit them
    else if(req.query.limit && Number.isInteger(parseInt(req.query.limit)) && req.query.sortby && (req.query.sortby === "id" || req.query.sortby === "name" || req.query.sortby === "budget") && req.query.sortdir && (req.query.sortdir === "asc" || req.query.sortdir === "desc")){
        db(`accounts`).orderByRaw(`LOWER(${req.query.sortby}) ${req.query.sortdir}`).limit(parseInt(req.query.limit))
        .then(accounts =>{
            res.status(200).json({
                queries_used: {
                    sortby: req.query.sortby,
                    sortdir: req.query.sortdir,
                    limit: parseInt(req.query.limit)
                },
                data: accounts
            })
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "3(limit, sortby, sortdir): There was an error getting accounts and sorting them in that order and direction, while imposing a limit."})
        })
    }

    // (2) If req.query has only a sortby and sortdir, and sortby and sortdir are verified
    // then: get all accounts and sort them in that by that order and in that direction
    else if (req.query.sortby && (req.query.sortby === "id" || req.query.sortby === "name" || req.query.sortby === "budget") && req.query.sortdir && (req.query.sortdir === "asc" || req.query.sortdir === "desc")){
        db(`accounts`).orderByRaw(`LOWER(${req.query.sortby}) ${req.query.sortdir}`)
        .then(accounts =>{
            res.status(200).json({
                queries_used: {
                    sortby: req.query.sortby,
                    sortdir: req.query.sortdir
                },
                data: accounts
            })
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "2(sortby and sortdir): There was an error getting accounts and sorting them in that order and direction."})
        })
    }

    // (2) If req.query only has a limit and sortby, and sortby and limit are verified
    // then: get all accounts and sort them, and limit them
    else if (req.query.limit && Number.isInteger(parseInt(req.query.limit)) && req.query.sortby && (req.query.sortby === "id" || req.query.sortby === "name" || req.query.sortby === "budget")){
        db(`accounts`).orderByRaw(`LOWER(${req.query.sortby})`).limit(parseInt(req.query.limit))
        .then(accounts =>{
            res.status(200).json({
                queries_used: {
                    sortby: req.query.sortby,
                    limit: parseInt(req.query.limit)
                },
                data: accounts
            })
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "2(limit and sortby): There was an error getting accounts and sorting them in that order and imposing a limit."})
        })
    }

    // (1) if only a limit exists and after parsing to an int, limit is a number
    // then: get all accounts while imposing the specified limit
    else if (req.query.limit && Number.isInteger(parseInt(req.query.limit))){
        db('accounts').limit(parseInt(req.query.limit))
        .then(accounts =>{
            res.status(200).json({
                queries_used: {
                    limit: parseInt(req.query.limit)
                },
                data: accounts
            })
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "1(limit): There was an error getting accounts and imposing the limit."})
        })
    }

    // (1) if only sortby exists, and sortby is id, name, or budget
    // then: get all accounts and sort them by that order
    else if (req.query.sortby && req.query.sortby === "id" || req.query.sortby === "name" || req.query.sortby === "budget") {
        db(`accounts`).orderByRaw(`LOWER(${req.query.sortby})`)
        .then(accounts =>{
            res.status(200).json({
                queries_used: {
                    sortby: req.query.sortby
                },
                data: accounts
            })
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "1(sortby): There was an error getting accounts and sorting them."})
        })
    }

    // (0) If all else fails, just show all accounts
    else {
        db('accounts')
        .then(accounts =>{
            res.status(200).json(accounts)
        })
        .catch(err=>{
            res.status(500).json({errorMessage: "There was an error getting accounts."})
        })
    }
    
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