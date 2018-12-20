import React, { useState } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Checkbox from "@material-ui/core/Checkbox";

const DisplayTable = props => {
  const [selectedRows, setSelectedRows] = useState([]);
  const {
    headers,
    data,
    multiSelect,
    onSelectChange,
    checkboxColor = "primary"
  } = props;

  const handleSelectAll = (_, checked) => {
    const rows = checked ? data.map((_, i) => i) : [];
    setSelectedRows(rows);
    onSelectChange(rows);
  };

  const handleSelect = (checked, i) => {
    const rows = checked
      ? [...selectedRows, i]
      : selectedRows.filter(r => r !== i);
    onSelectChange(rows);
    setSelectedRows(rows);
  };

  const handleRowClick = i => {
    if (!multiSelect) {
      return;
    }

    handleSelect(!selectedRows.includes(i), i);
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <>
            {(() => {
              if (multiSelect) {
                return (
                  <TableCell>
                    <Checkbox
                      color={checkboxColor}
                      indeterminate={
                        selectedRows.length > 0 &&
                        selectedRows.length < data.length
                      }
                      checked={selectedRows.length === data.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                );
              }
            })()}
            {headers.map(header => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, index) => (
          <TableRow
            hover={true}
            key={index}
            onClick={() => handleRowClick(index)}
          >
            {(() => {
              if (multiSelect) {
                return (
                  <TableCell>
                    <Checkbox
                      color={checkboxColor}
                      checked={selectedRows.includes(index)}
                      onChange={(_, checked) => handleSelect(checked, index)}
                    />
                  </TableCell>
                );
              }
            })()}
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DisplayTable;
