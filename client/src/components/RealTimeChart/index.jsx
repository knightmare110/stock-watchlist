// src/components/RealTimeChart/index.jsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const RealTimeChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    // Transform `data` for the bar chart
    const formattedData = Object.entries(
      data.reduce((acc, update) => {
        Object.entries(update).forEach(([ticker, price]) => {
          acc[ticker] = parseFloat(price);
        });
        return acc;
      }, {})
    ).map(([ticker, price]) => ({ ticker, price }));

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand()
      .domain(formattedData.map((d) => d.ticker))
      .range([0, width])
      .padding(0.2);

    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(formattedData, (d) => d.price)])
      .range([height, 0]);

    g.append("g").call(d3.axisLeft(yScale));

    g.selectAll(".bar")
      .data(formattedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.ticker))
      .attr("y", (d) => yScale(d.price))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height - yScale(d.price))
      .attr("fill", "#69b3a2");

  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default RealTimeChart;
