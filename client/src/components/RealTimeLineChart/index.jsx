// src/components/RealTimeLineChart.jsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const RealTimeLineChart = ({ data, watchlist }) => {
  const svgRef = useRef();

  useEffect(() => {
    // If there's no data, exit early
    if (!data || data.length === 0) return;

    // Set up SVG dimensions and margins
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };

    // Create SVG canvas
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);
    svg.selectAll("*").remove();  // Clear the canvas for re-rendering

    // Define color scale for each ticker
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(watchlist.map((stock) => stock.ticker));

    // Set the x-axis time range from now to 10 minutes in the past
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 10 * 60 * 1000);

    // Set up x-scale as a time scale
    const xScale = d3.scaleTime().domain([startTime, endTime]).range([margin.left, width - margin.right]);

    // Set up y-scale based on the min and max stock prices
    const yScale = d3
      .scaleLinear()
      .domain([d3.min(data, (d) => d.price) - 5, d3.max(data, (d) => d.price) + 5])
      .range([height - margin.bottom, margin.top]);

    // Add x and y axes
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(xScale).ticks(d3.timeMinute.every(1)).tickFormat(d3.timeFormat("%H:%M:%S")));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yScale));

    // Line generator for each ticker
    const lineGenerator = d3.line().x((d) => xScale(d.time)).y((d) => yScale(d.price));

    // Group data by ticker and draw a line for each one
    const groupedData = d3.groups(data, (d) => d.ticker);
    groupedData.forEach(([ticker, values]) => {
      svg
        .append("path")
        .datum(values.filter((d) => d.time >= startTime && d.time <= endTime)) // Only show data within the last 10 minutes
        .attr("fill", "none")
        .attr("stroke", colorScale(ticker))
        .attr("stroke-width", 1.5)
        .attr("d", lineGenerator);
    });

  }, [data, watchlist]);  // Re-render the chart when data or watchlist updates

  return (
    <div>
      <svg ref={svgRef}>
        <g className="x-axis" />
        <g className="y-axis" />
      </svg>
      <div className="flex mt-4">
        {watchlist.map((stock, index) => (
          <div key={index} className="flex items-center mr-4">
            <div
              className="w-4 h-4"
              style={{ backgroundColor: d3.schemeCategory10[index % 10] }}
            ></div>
            <span className="ml-2">{stock.ticker}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeLineChart;
