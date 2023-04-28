class Player {
    constructor(name, age, contractLength, salary, playerRating, form, baseSellingPrice, address ) {
        this.name = name
        this.age = age
        this.contractLength = contractLength
        this.salary = salary
        this.playerRating = playerRating
        this.form = form
        this.baseSellingPrice  = baseSellingPrice
        this.address = address
    }
}

class Club {
    constructor(name, location, address) {
        this.name = name
        this.location = location
        this.address = address
    }
}