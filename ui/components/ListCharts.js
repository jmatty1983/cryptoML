import React, { useEffect, useState, } from "react";

export default (props) => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);
  
  
     const fetchData = async () => {
      const response = await fetch(`/api/candles`);
      const json = await response.json();
    
      setTableData(json);
      setLoading(false);
    };
  
    useEffect(() => {
      setLoading(true);
      fetchData();
    }, []);
  
    return (
      <>
        <select onChange={(event) => props.setTable(encodeURIComponent(event.target.value))}>
            {tableData.map(table => {
              return <option key={table.id} value={table}>{table}</option>
            })}
          </select>
    </>
    );
  };