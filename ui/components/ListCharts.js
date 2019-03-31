import React, { useEffect, useState, } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from '@material-ui/core/Select';


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