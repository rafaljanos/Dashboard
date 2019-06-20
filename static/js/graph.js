queue()
    .defer(d3.csv, "data/Salaries.csv") // directory of file with data to use
    .await(makeGraphs);                 // makeGraphs is any name we want
    
function makeGraphs(error, salaryData) {// function for that name we choose
    var ndx = crossfilter(salaryData);  // loading salary data to crossfilter
    
    salaryData.forEach(function(d) {
        d.salary = parseInt(d.salary);  // changing the text data salary to intedur version of the salary
    })
    
    show_discipline_selector(ndx);      // passind NDX filter to a function that will draw graph discipline_selector
    show_gender_balance(ndx);           // passind NDX filter to a function that will draw graph gender_balance
    show_average_salaries(ndx);         // any name
    show_rank_distribution(ndx);      
    
    dc.renderAll();                     // to render it all
}    
 
function show_discipline_selector(ndx) {        // function for show_discipline_selector
    dim = ndx.dimension(dc.pluck(`discipline`));
    group = dim.group()                         // simple group
    
    dc.selectMenu("#discipline-selector")       // it creates a selector menu
        .dimension(dim)
        .group(group);
}
 
function show_gender_balance(ndx) {           // function for show_gender_balance
    var dim = ndx.dimension(dc.pluck(`sex`)); // create dimension of sex variable
    var group = dim.group();                  // create a group
    
    dc.barChart("#gender-balance")            // create a bar chart for specific div ID
        .width(400)
        .height(300)
        .margins({top: 10, right:50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender")
        .yAxis().ticks(20);
}

function show_average_salaries(ndx) {
    var dim = ndx.dimension(dc.pluck(`sex`));
    
    function add_item(p, v) {           // p-keeps track of total and avarage and count, v-each data items we adding
        p.count++;                      // increment the count in p object
        p.total += v.salary;            // increment total by the salary of the data 
        p.average = p.total / p.count;  // total devidet by the count
        return p;                       // always return p at the end add or remove function
    }
    
    function remove_item(p, v) {    
        p.count--;                          // reduce the count
        if(p.count == 0) {                  // if the count is 0 we set total count to 0
            p.total = 0;
            p.average = 0;
        }   else {                          // if the count is grater than 0 we use normal calculations
            p.total -= v.salary             // reduce the total by the amount of the salary
            p.average = p.total / p.count;  // total devidet by the count
        }   
        return p;     
    }
    
    function initialise() {                 // creates initial value for p
        return {count: 0,total: 0, average: 0};
    }
    
    var averageSalasyByGender = dim.group().reduce(add_item, remove_item, initialise);
    
    
    dc.barChart("#average-salary")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageSalasyByGender)
        .valueAccessor(function(d) {            // to specify which of the 3 values will be plotet
            return d.value.average.toFixed(2);  // .toFixed(2)-reduce to 2 decimels number 2 spaces after (,00)
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender")
        .yAxis().ticks(4);
}

function show_rank_distribution(ndx) {
    
    
    
    var profByGender = dim.group().reduce(
        function (p, v) {
            p.total++;
            if(v.rank == rank) {           // match if the rank what we are looking for is profesor
                p.match++;
            }
            return p;
        },
        function (p, v) {
            p.total--;
            if(v.rank == rank)  {          // match if the rank what we are looking for is profesor
                p.mach--;
            }
            return p;
        },
        function () {
            return {total: 0, match: 0};
        }
    );
    
    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
        function (p, v) {
            p.total++;
            if(v.rank == rank) {           // match if the rank what we are looking for is profesor
                p.match++;
            }
            return p;
        },
        function (p, v) {
            p.total--;
            if(v.rank == rank)  {          // match if the rank what we are looking for is profesor
                p.mach--;
            }
            return p;
        },
        function () {
            return {total: 0, match: 0};
        }
    );
    }
    
    var profByGender = rankByGender(dim, "Prof");
    var asstProfByGender = rankByGender(dim, "AsstProf");
    var assocProfByGender = rankByGender(dim, "AssocProf");
    
    // console.log(profByGender.all());        // to inspect and check if that works
  
    dc.barChart("#rank-distribution")
        .width(400)
        .height(300)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "Asst Prof")       // stacks this group on top of prof
        .stack(assocProfByGender, "Assoc Prof")     // stacks this group on top of asst
        .valueAccessor(function(d) {               // geting procentage of the total
            if(d.value.total > 0) {
                 return (d.value.match / d.value.total) * 100; //matching amount devide by total and multiply by 100
            } else {
                return 0;
            }
    })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5))
        .margins({top: 10, right: 100, bottom: 30, left: 30});
}