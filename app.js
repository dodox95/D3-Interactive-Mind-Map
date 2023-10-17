const data = {
    name: "Root",
    children: [
        { name: "Child 1" },
        { name: "Child 2", children: [{ name: "Grandchild" }] }
    ]
};

const width = 1920;
const height = 640;

const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

const zoomG = svg.append("g");

const treeLayout = d3.tree().size([width, height - 200]);

const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
    });

svg.call(zoom);

let selectedNode = null;
let links;

function dragstarted(event, d) {
    d3.select(this).raise();
    d3.select(this).attr('cursor', 'grabbing');
}

function dragged(event, d) {
    d.x += event.dx;
    d.y += event.dy;
    d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
    
    // Aktualizacja linków podczas przeciągania
    links.each(function(l) {
        if (l.source.id === d.id) {
            d3.select(this)
                .attr("x1", d.x)
                .attr("y1", d.y);
        } else if (l.target.id === d.id) {
            d3.select(this)
                .attr("x2", d.x)
                .attr("y2", d.y);
        }
    });
}

function dragended(event, d) {
    d3.select(this).attr('cursor', 'grab');
}

const drag = d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);

function updateMindmap() {
    zoomG.selectAll('.node, .link').remove();

    const root = d3.hierarchy(data).eachBefore((d, i) => { d.id = i; }); // Dodawanie ID dla każdego węzła
    treeLayout(root);

    const nodes = zoomG.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`)
        .on('click', function(d) {
            if (selectedNode) {
                d3.select(selectedNode).select('circle').style('stroke', 'none');
            }
            selectedNode = this;
            d3.select(this).select('circle').style('stroke', 'red');
        })
        .call(drag);

    nodes.append("circle").attr("r", 5);

    nodes.append("text")
        .attr("dy", -10)
        .style("text-anchor", "middle")
        .text(d => d.data.name);

    updateLinks();
}

function updateLinks() {
    const root = d3.hierarchy(data).eachBefore((d, i) => { d.id = i; });
    treeLayout(root);

    links = zoomG.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", "#ccc");
}

document.getElementById("addNodeForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const nodeName = document.getElementById("nodeName").value;

    if (selectedNode && nodeName) {
        const nodeData = d3.select(selectedNode).datum();
        if (!nodeData.data.children) {
            nodeData.data.children = [];
        }
        nodeData.data.children.push({ name: nodeName });

        updateMindmap();
        document.getElementById("nodeName").value = "";
    }
});

document.getElementById("zoom_in").addEventListener("click", function() {
    zoom.scaleBy(svg.transition().duration(750), 1.1);
});

document.getElementById("zoom_out").addEventListener("click", function() {
    zoom.scaleBy(svg.transition().duration(750), 0.9);
});

updateMindmap();
