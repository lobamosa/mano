import React from 'react';
import styled from 'styled-components';
import { theme } from '../config';

const Table = ({ columns = [], data = [], rowKey, onRowClick, nullDisplay = '', className, title, noData }) => {
  if (!data.length && noData) {
    return (
      <TableWrapper className={className}>
        <thead>
          {!!title && (
            <tr>
              <td className="title" colSpan={columns.length}>
                {title}
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={columns.length}>{noData}</td>
          </tr>
        </thead>
      </TableWrapper>
    );
  }

  return (
    <TableWrapper className={className} withPointer={Boolean(onRowClick)}>
      <thead>
        {!!title && (
          <tr>
            <td className="title" colSpan={columns.length}>
              {title}
            </td>
          </tr>
        )}
        <tr>
          {columns.map((column) => (
            <td className={`column-header ${column.left && 'align-left'}`} key={column.title}>
              {column.title}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => {
          return (
            <tr onClick={() => (onRowClick ? onRowClick(item) : null)} key={item[rowKey] || item._id}>
              {columns.map((column) => {
                return (
                  <td className="table-cell" key={item[rowKey] + column.dataKey + item[column.dataKey]}>
                    {column.render ? column.render(item) : item[column.dataKey] || nullDisplay}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </TableWrapper>
  );
};

const TableWrapper = styled.table`
  width: 100%;
  padding: 16px;
  background: ${theme.white};
  box-shadow: 0 4px 8px rgba(29, 32, 33, 0.02);
  border-radius: 8px;
  -fs-table-paginate: paginate;

  thead {
    display: table-header-group;
  }

  tr {
    height: 56px;
    border-radius: 4px;
    ${(props) => !props.withPointer && 'cursor: auto;'}
  }

  tbody > tr:nth-child(odd) {
    background-color: ${theme.black05};
  }

  tbody > tr:hover {
    background-color: ${theme.black25};
  }

  thead td {
    color: ${theme.main};

    font-weight: 800;
    font-size: 12px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  thead .title {
    caption-side: top;
    font-weight: bold;
    font-size: 24px;
    line-height: 32px;
    padding: 20px 0 10px 0;
    width: 100%;
    color: #1d2021;
    text-transform: none;
  }

  td {
    padding: 5px 0;
    /* padding-left: 20px; */
    font-size: 14px;
    min-width: 100px;
  }

  .column-header {
    text-align: center;
    padding-left: 0;
    padding-right: 0;
  }

  .align-left {
    text-align: left;
  }

  .table-cell {
    text-align: center;
  }

  td:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  td:last-child {
    border-bottom-right-radius: 10px;
    border-top-right-radius: 10px;
  }
`;

export default Table;