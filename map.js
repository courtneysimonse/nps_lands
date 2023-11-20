
// synchronous calls to data files
var statesFile = d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),  // states geometry from cdn
npsFile = d3.json("nps_lands.json");  // state information

// use promise to call all data files, then send data to callback
Promise.all([statesFile, npsFile]).then(drawMap, error);

// function fired if there is an error
function error(error) {
    console.log(error)
}

// accepts the data as a parameter statesData
function drawMap(data) {
    
    var statesJSON = data[0];
    var npsJSON = data[1];
    
    var statesGeoJSON = topojson.feature(statesJSON, {
        type: "GeometryCollection",
        geometries: statesJSON.objects.states.geometries
    });

    var npsGeoJSON = topojson.feature(npsJSON, {
        type: "GeometryCollection",
        geometries: npsJSON.objects.nps_lands.geometries
    })
    
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
        // `0 0 975 610`
        `0 0 ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
        }`
        )
    .attr('preserveAspectRatio', 'none meet')
    .append('g')
    .attr(
        'transform',
        'translate(' + margin.left + ',' + margin.top + ')'
        );

    const zoom = d3.zoom().scaleExtent([.7, 15]).on("zoom", zoomed);
    zoom(svg); // now zoom listens for events that occur on SVG
        
    const projection = d3.geoAlbersUsa()
    // .fitExtent([[10,10],[width-10,height-10]], statesGeoJSON)
    
    // Prepare SVG path and color, import the
    // effect from above projection.
    // const path = d3.geoPath()
    // .projection(projection);

    const compositePath = d3.geoPath()
    .projection(projection);
    
    
    // select popup element
    var popup = d3.select("#popup");
    var popupEl = document.getElementById("popup");
    
    var selected;
    
    // create and append a new SVG g element to the SVG
    var statesBoundary = svg.append("g")
    .selectAll("path")  // select all the paths (that don't exist yet)
    .data(statesGeoJSON.features) // use the GeoJSON data
    .enter()  // enter the selection
    .append("path")  // append new path elements for each data feature
    .attr("d", (d) => compositePath(d))  // give each path a d attribute value
    .attr("data-state", (d) => {return d.properties.name})
    .style("stroke", "#A67E76")
    .attr("fill", "#D9B1A3")
    .attr("fill-opacity", 1)
    .attr("stroke-width", "1px")
    .attr("stroke-opacity", 0.4)
    .on("mouseover", function(e, d) {  // when mousing over an element
        // d3.select(this).classed("hover", true) // select it and add a class name
        
        // const list = [...this.parentNode.children]
        // const index = list.indexOf(this)
        // d.oindex = index
        // this.parentNode.appendChild(this)  // bring element to front
        
        // let props = statesData.find(x => x["State"] == d.properties.name);
        
        // if (props != undefined && props.Representative != '') {
        //     this.style.cursor = 'pointer';
        // }
        
    })
    .on("mouseout", function(e, d) { // when mousing out of an element
        // d3.select(this).classed("hover", false) // remove the class
        
    })
    .on("click", function (e, d) { // on click, fill popup information and show
        
        e.stopPropagation();
        
 
    })

    // create and append a new SVG g element to the SVG
    var npsBoundary = svg.append("g")
    .selectAll("path")  // select all the paths (that don't exist yet)
    .data(npsGeoJSON.features) // use the GeoJSON data
    .enter()  // enter the selection
    .append("path")  // append new path elements for each data feature
    .attr("d", (d) => compositePath(d))  // give each path a d attribute value
    .attr("data-park", (d) => {return d.properties.PARK_NAME})
    .style("stroke", "#848C45")
    .attr("fill", "#254021")
    .attr("fill-opacity", .6)
    .attr("stroke-width", ".5px")
    .attr("stroke-opacity", .2)
    .on("mouseover", function(e, d) {  // when mousing over an element
        d3.select(this).classed("hover", true) // select it and add a class name
        this.style.cursor = 'pointer';
        
        let popupHTML = d.properties.UNIT_NAME;
        
        document.getElementById('content-div').innerHTML = popupHTML;

        popup.style("display", "block");
        
        popup.transition().duration(200).style("opacity", 1);   // make tooltip visible and update info
        
        // console.log(e.srcElement);
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
    })
    // .on("mousemove", function(e, d) {
    //     // update the position of the tooltip

    //     const virtualEl = {
    //         getBoundingClientRect() {
    //             return {
    //                 width: 0,
    //                 height: 0,
    //                 x: e.clientX,
    //                 y: e.clientY,
    //                 top: e.clientY,
    //                 left: e.clientX,
    //                 right: e.clientX,
    //                 bottom: e.clientY,
    //             };
    //         },
    //     };
    //     // console.log(virtualEl);
        
    //     FloatingUIDOM.computePosition(virtualEl, popupEl, {
    //         placement: 'bottom',
    //         middleware: [
    //             FloatingUIDOM.offset(5),
    //             FloatingUIDOM.flip(),
    //             FloatingUIDOM.shift({padding: 8}),
    //             FloatingUIDOM.arrow({element: document.getElementById("arrow")})
    //         ]
    //     }).then(({x, y, placement, middlewareData}) => {
    //         Object.assign(popupEl.style, {
    //             left: `${x}px`,
    //             top: `${y}px`,
    //         });
            
    //         const {x: arrowX, y: arrowY} = middlewareData.arrow;
            
    //         const staticSide = {
    //             top: 'bottom',
    //             right: 'left',
    //             bottom: 'top',
    //             left: 'right',
    //         }[placement.split('-')[0]];
            
    //         Object.assign(document.getElementById("arrow").style, {
    //             left: arrowX != null ? `${arrowX}px` : '',
    //             top: arrowY != null ? `${arrowY}px` : '',
    //             right: '',
    //             bottom: '',
    //             [staticSide]: '-4px',
    //         });
    //     });
    // })
    .on("mouseout", function(e, d) { // when mousing out of an element
        d3.select(this).classed("hover", false) // remove the class
        popup.transition().duration(200).style("opacity", 0);
        popup.style("display", "none");
    })
    // .on("click", function (e, d) { // on click, fill popup information and show
        
    //     e.stopPropagation();
        
    
    // })
    

    d3.select('body').on('click', () => {
        popup.style("display", "none");
        popup.transition().duration(200).style("opacity", 0);
        
    })
    
    
    d3.select(window).on('resize', () => {
        svg.attr(
            'viewBox',
            `0 0 ${width + margin.left + margin.right} ${
                height + margin.top + margin.bottom
            }`
            );
        });
        
    function zoomed(event) {
        const { transform } = event;
        statesBoundary.attr("transform", transform);
        npsBoundary.attr("transform", transform)
    }
        
} // end drawMap
    