
// synchronous calls to data files
var statesFile = d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),  // states geometry from cdn
statesCSV = d3.csv("https://docs.google.com/spreadsheets/d/1dJkbiwN95d5IB4Gj0yVjZt7g5LhyCtkN_jj9nvXs5UA/export?format=csv&sheet=Data"),  // state information
labelsJSON = d3.json("labels.json");

// use promise to call all data files, then send data to callback
Promise.all([statesFile, statesCSV, labelsJSON]).then(drawMap, error);

// function fired if there is an error
function error(error) {
    console.log(error)
}

// accepts the data as a parameter statesData
function drawMap(data) {
    
    var statesJSON = data[0];
    var statesData = data[1];
    var labelCoords = data[2];
    
    var statesGeoJSON = topojson.feature(statesJSON, {
        type: "GeometryCollection",
        geometries: statesJSON.objects.states.geometries
    });
    
    const margin = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
    };
    
    const width = document.getElementById('map').clientWidth - margin.left - margin.right;
    const height = document.getElementById('map').clientHeight - margin.top - margin.bottom;
    
    // select the map element
    var svg = d3.select("#map")
    .append("svg")  // append a new SVG element
    .attr(
        'viewBox',
        `0 0 975 610`
        // `0 0 ${width + margin.left + margin.right} ${
        //     height + margin.top + margin.bottom
        // }`
        )
    .attr('preserveAspectRatio', 'xMidYMin meet')
    .append('g')
    .attr(
        'transform',
        'translate(' + margin.left + ',' + margin.top + ')'
        );
        
    const projection = d3.geoAlbersUsa()
    // .fitExtent([[10,10],[width-10,height-10]], statesGeoJSON)
    
    // Prepare SVG path and color, import the
    // effect from above projection.
    const path = d3.geoPath()
    .projection(projection);
    
    
    // select popup element
    var popup = d3.select("#popup");
    var popupEl = document.getElementById("popup");
    
    var selected;
    
    // create and append a new SVG g element to the SVG
    var statesBoundary = svg.append("g")
    .selectAll("path")  // select all the paths (that don't exist yet)
    .data(statesGeoJSON.features.filter(x => x.id <= 56 && x.properties.name != "Alaska" && x.properties.name != "Hawaii")) // use the GeoJSON data
    .enter()  // enter the selection
    .append("path")  // append new path elements for each data feature
    .attr("d", (d) => {
        if (d.properties.name == 'District of Columbia') {
            let star = d3.symbol(d3.symbolStar, 96)();
            return star;
        } else {
            return path(d);
        }
    })  // give each path a d attribute value
    .attr("data-state", (d) => {return d.properties.name})
    .style("stroke", "#333")
    .attr("fill", (d, i) => {
        let data = statesData.find(x => x["State"] == d.properties.name);
        if (data == undefined) {
            console.log(d);
        } else {
            return data["State Color"];
        }
        
    })
    .attr("fill-opacity", 1)
    .attr("stroke-width", "2px")
    .attr("stroke-opacity", 0.7)
    .on("mouseover", function(e, d) {  // when mousing over an element
        // d3.select(this).classed("hover", true) // select it and add a class name
        
        // const list = [...this.parentNode.children]
        // const index = list.indexOf(this)
        // d.oindex = index
        // this.parentNode.appendChild(this)  // bring element to front
        
        let props = statesData.find(x => x["State"] == d.properties.name);
        
        if (props != undefined && props.Representative != '') {
            this.style.cursor = 'pointer';
        }
        
    })
    .on("mouseout", function(e, d) { // when mousing out of an element
        // d3.select(this).classed("hover", false) // remove the class
        
    })
    .on("click", function (e, d) { // on click, fill popup information and show
        
        e.stopPropagation();
        
        let props = statesData.find(x => x["State"] == d.properties.name);
        
        if (props != undefined && props.Representative != '') {
            if (selected != null) {
                selected.classed("selected", false) // removed class from last selected
            }
            selected = d3.select(this);
            d3.select(this).classed("selected", true) // select it and add a class name
            let popupHTML = '';
            
            popupHTML +=`<div class="container-location">`;
            
            // add image
            if (props['Image Link']) {
                popupHTML += `<img class="popup-image" src="https://incitesp.com/${props['Image Link']}">`
            }
            
            // state name
            popupHTML += `<h3>${props['State']}</h3>`;
            
            popupHTML += `<div>`
            
            // representative
            if (props['Representative'] != '') {
                popupHTML += `<p><strong>Representative:</strong> ${props['Representative']}</p>`
            }
            if (props['Email Address'] != '') {
                popupHTML += `<p><strong>Email:</strong> ${props['Email Address']}</p>`
            }
            if (props["Phone Number"]) {
                popupHTML += `<p><strong>Phone:</strong> ${props["Phone Number"]}</p>`;
            }
            
            if (props["Website Button Link"]) {
                popupHTML += `</div><a class="popup-btn" style="color:${props["Website Button Text Color"]};background-color:${props["Website Button Color"]}" href="${props["Website Button Link"]}">Visit Website</a>`;
            }
            popupHTML += `</div>`;
            
            document.getElementById('content-div').innerHTML = popupHTML;

            popup.style("display", "block");
            
            popup.transition().duration(200).style("opacity", 1);   // make tooltip visible and update info
            
            // console.log(e.srcElement);
            console.log(e);
            const virtualEl = {
                getBoundingClientRect() {
                    return {
                        width: 0,
                        height: 0,
                        x: e.clientX,
                        y: e.clientY,
                        top: e.clientY,
                        left: e.clientX,
                        right: e.clientX,
                        bottom: e.clientY,
                    };
                },
            };
            // console.log(virtualEl);
            
            FloatingUIDOM.computePosition(virtualEl, popupEl, {
                placement: 'bottom',
                middleware: [
                    FloatingUIDOM.offset(5),
                    FloatingUIDOM.flip(),
                    FloatingUIDOM.shift({padding: 8}),
                    FloatingUIDOM.arrow({element: document.getElementById("arrow")})
                ]
            }).then(({x, y, placement, middlewareData}) => {
                Object.assign(popupEl.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                });
                
                const {x: arrowX, y: arrowY} = middlewareData.arrow;
                
                const staticSide = {
                    top: 'bottom',
                    right: 'left',
                    bottom: 'top',
                    left: 'right',
                }[placement.split('-')[0]];
                
                Object.assign(document.getElementById("arrow").style, {
                    left: arrowX != null ? `${arrowX}px` : '',
                    top: arrowY != null ? `${arrowY}px` : '',
                    right: '',
                    bottom: '',
                    [staticSide]: '-4px',
                });
            });
            
        } else {
            popup.transition().duration(200).style("opacity", 0);
            popup.style("display", "none");
        }
    })


    var dc = path.centroid(statesGeoJSON.features.find(x => x.properties.name == "District of Columbia"));

    // find DC star, move, and raise to top of states
    d3.select(`[data-state="District of Columbia"]`)
        .attr("transform", (d) => { 
            return "translate(" + dc[0] + "," + dc[1] + ")";
        })
        .raise();
    
    // prepare label data
    labelCoords.forEach(pt => {
        let coords = projection([+pt.lon, +pt.lat]);
        if (coords != null) {
            pt.x = coords[0];
            pt.y = coords[1];
        }

    });

    labelCoords = labelCoords.filter(l => l.x != null && l.usps != "AK" && l.usps != "HI");

    // force function to move label overlap
    applySimulation = (nodes) => {
        const simulation = d3.forceSimulation(nodes)
            .force("x", d3.forceX().x(d => d.x).strength(0.3))
            .force("y", d3.forceY().y(d => d.y).strength(0.3))
            .force("charge", d3.forceManyBody().strength(-1))
            .force("collide", d3.forceCollide().radius(5).strength(1))
            .stop()
        
        while (simulation.alpha() > 0.01) {
            simulation.tick(); 
        }
        
        return simulation.nodes();
    }
    
    // Append the place labels, setting their initial positions to those in the CSV
    labelCoords = applySimulation(labelCoords);

    // svg element for labels
    var placeLabels = svg.selectAll('.place-label')
    .data(labelCoords)
    .join('text')
        .attr('class', 'place-label')
        .attr('text-anchor', 'middle')
        .attr("data-usps", function(d) {return d.usps;})
        .text( function(d) { return d.usps; } )
        .attr("transform", function(d, i) { return "translate(" + d.x + "," + d.y + ")";});


    // call out lines for labels outside of state polygons
    svg.append('g')
        .selectAll('path')
        .data(labelCoords)
        .join('path')
            .attr('d', (d) => {
                let s = statesGeoJSON.features.find( x => x.id == d.fips );

                if (!d3.geoContains(s, [d.lon, d.lat])) {
                    let c = path.centroid(s);
                    let textAdj = 3;

                    let length = Math.sqrt((d.x - c[0])**2 + (d.y - textAdj - c[1])**2);
                    let r = (length - 10) / length;
                    let coords = [((1 - r) * c[0] + r * d.x), ((1 - r) * c[1] + r * (d.y - textAdj))]

                    if (d.usps == "NJ") {
                        c[0] = c[0] + 3;
                    }

                    return d3.line()([c, coords]);
                } else {
                    return '';
                }
            })
            .attr('stroke', '#092b44')
            .attr('stroke-opacity', .7);


    d3.select('body').on('click', () => {
        popup.style("display", "none");
        popup.transition().duration(200).style("opacity", 0);
        
        if (selected != null) {
            selected.classed("selected", false) // removed class from last selected
        }
    })
    
    
    d3.select(window).on('resize', () => {
        svg.attr(
            'viewBox',
            `0 0 ${width + margin.left + margin.right} ${
                height + margin.top + margin.bottom
            }`
            );
        });
        
    
        
} // end drawMap
    