import { useState, useEffect } from "react";
// nodejs library that concatenates classes
import classnames from "classnames";
import Modals from "views/IndexSections/Modals";
import axios from "axios";
// reactstrap components
import {
  Button,
  Pagination,
  PaginationItem,
  PaginationLink,
  Container,
  Row,
  Col,
  FormGroup,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  UncontrolledTooltip,
  Modal,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Popover,
  UncontrolledPopover,
  PopoverBody,
  PopoverHeader,
} from "reactstrap";

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import CardsFooter from "components/Footers/CardsFooter.js";
import Tabs from "components/Tabs.js";
const BACKEND_URL = "http://localhost:8080";

function HistoryTable({ selectedData }) {
  const [originalData, setOriginalData] = useState([]);
  const [data, setData] = useState([]);
  const [sortColumn, setSortColumn] = useState();
  const [sortDirection, setSortDirection] = useState();
  const [noPerPage, setNoPerPage] = useState(5);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    setData([...selectedData]);
    setOriginalData([...selectedData]);
    console.log(data.length);
    setSortColumn("id");
    setSortDirection("asc");
  }, [selectedData]);

  const handleSort = async (column) => {
    const newSortDirection =
      column === sortColumn
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : "asc";
    setSortColumn(column);
    setSortDirection(newSortDirection);
  };

  useEffect(() => {
    // Clone the data array and sort it
    const sortedData = [...data].sort((a, b) => {
      const compareValue = sortDirection === "asc" ? 1 : -1;
      return a[sortColumn] > b[sortColumn] ? compareValue : -compareValue;
    });

    setData(sortedData);
  }, [sortDirection, sortColumn]);

  // Function to handle checkbox click
  // const handleCheckboxClick = (id) => {
  //   const newSelectedRows = [...selectedRows];
  //   if (newSelectedRows.includes(id)) {
  //     // If the ID is already in the array, remove it (unselect)
  //     newSelectedRows.splice(newSelectedRows.indexOf(id), 1);
  //   } else {
  //     // If the ID is not in the array, add it (select)
  //     newSelectedRows.push(id);
  //   }
  //   setSelectedRows(newSelectedRows);
  // };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    // Filter the data based on the selected option
    if (filter === "All") {
      setData([...originalData]);
    } else {
      const filteredData = originalData.filter(
        (row) => row.modelInfo && row.modelInfo.Model_Version === filter
      );
      setData(filteredData);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter the data based on the search query
    const filteredData = originalData.filter((row) => {
      return (
        Object.keys(row).some((key) =>
          typeof row[key] === "object"
            ? Object.values(row[key]).some(
                (value) =>
                  typeof value === "string" &&
                  value.toLowerCase().includes(query.toLowerCase())
              )
            : false
        ) || row.currentDate.includes(query)
      );
    });
    setData(filteredData);
    setSelectedPage(1);
  };
  const resetSearch = () => {
    setSearchQuery("");
    setData([...originalData]);
  };
  const currentPageData = data.slice((selectedPage - 1) * noPerPage, selectedPage * noPerPage);

  return (
    <>
      <main>
        <div className="position-relative">
          {/* shape Hero */}

          {/* 1st Hero Variation */}
        </div>
        <section className="pt-4">
          <Container>
            <div
              className="d-flex flex-wrap align-items-center mb-4"
              style={{ gap: "20px" }}
            >
              {/* Search */}
              <FormGroup className="m-0">
                <InputGroup>
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="fa fa-search" />
                    </InputGroupText>
                  </InputGroupAddon>
                  <Input
                    placeholder="Search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchQuery && (
                    <InputGroupAddon addonType="append">
                      <Button color="info" onClick={resetSearch}>
                        Clear
                      </Button>
                    </InputGroupAddon>
                  )}
                </InputGroup>
              </FormGroup>

              <FormGroup className="m-0">
                <InputGroup>
                  <InputGroupAddon addonType="append">
                    <InputGroupText>TYPE</InputGroupText>
                  </InputGroupAddon>
                  {/* <Input placeholder="Search" type="text" /> */}
                  <select
                    className="custom-select w-25"
                    defaultValue={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                  >
                    <option defaultValue="All">All</option>
                    <option defaultValue="classification">
                      classification
                    </option>
                    <option defaultValue="OCR">OCR</option>
                    <option defaultValue="segmentation">segmentation</option>
                  </select>
                </InputGroup>
              </FormGroup>
              {/*Download button*/}
              {/* <Button className="btn-icon ml-auto" color="info">
                <span className="btn-inner--icon mr-1">
                  <i className="fa fa-download" />
                </span>
                <span className="btn-inner--text">Download</span>
              </Button> */}
            </div>
            <Row>
              <Col>
                <div className="table-responsive">
                  <div>
                    <table className="table align-items-center">
                      <thead className="thead-light">
                        <tr>
                          {/* <th scope="col">
                            <input
                              type="checkbox"
                              id="selectAll"
                              name="select"
                              checked={selectAll}
                              onChange={() => {
                                if (!selectAll) {
                                  setSelectedRows([
                                    ...[...data].map((row) => row.id),
                                  ]);
                                } else {
                                  setSelectedRows([]);
                                }
                                setSelectAll(!selectAll);
                              }}
                            />
                          </th> */}
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("id")}
                          >
                            #
                            {sortColumn === "id" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("image")}
                          >
                            Image
                            {sortColumn === "image" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("modelVersion")}
                          >
                            Model Version
                            {sortColumn === "modelVersion" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("type")}
                          >
                            Type
                            {sortColumn === "type" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("model")}
                          >
                            Model
                            {sortColumn === "model" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("prediction")}
                          >
                            Prediction
                            {sortColumn === "prediction" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("confidence")}
                          >
                            Confidence
                            {sortColumn === "confidence" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          <th
                            scope="col"
                            className="text-nowrap text-center"
                            onClick={() => handleSort("date")}
                          >
                            Date
                            {sortColumn === "date" && (
                              <i className={`fa fa-sort-${sortDirection}`} />
                            )}
                          </th>
                          {/* <th scope="col" className="text-nowrap text-center">
                            Detailed View
                          </th> */}
                        </tr>
                      </thead>
                      <tbody className="list">
                        {data.length > 0 ? (
                          currentPageData.map((row, idx) => {
                            const id = (selectedPage - 1) * noPerPage + idx + 1;
                            const predictionKeys = Object.keys(row).filter(key => !isNaN(key)); // Filter to get keys like "0", "1", etc.
                            return (
                              
                              id <= noPerPage * selectedPage &&
                              id >= noPerPage * (selectedPage - 1) && (
                                <tr key={"row" + id}>
                                  {/* <td scope="row" className="align-middle">
                                    <input
                                      type="checkbox"
                                      id="selectAll"
                                      name="select"
                                      checked={selectedRows.includes(row.id)}
                                      onChange={() =>
                                        handleCheckboxClick(row.id)
                                      }
                                    />
                                  </td> */}
                                  <td className="text-center align-middle">
                                    {id}
                                  </td>
                                  <td className="text-center align-middle">
                                    {/* {BACKEND_URL.concat("/",row["filePath"].replace("uploads/", ""))} */}

                                    <img
                                      src={BACKEND_URL.concat(
                                        "/",
                                        row["filePath"].replace("uploads/", "")
                                      )}
                                      alt={row["filepath"]}
                                      style={{
                                        width: "50px",
                                        objectFit: "cover",
                                        aspectRatio: 1,
                                      }}
                                    />
                                  </td>
                                  <td className="text-center align-middle">
                                    {row["modelInfo"]["Model_Version"]}
                                  </td>
                                  <td className="text-center align-middle">
                                    {row["modelInfo"]["Model_Type"]}
                                  </td>
                                  <td className="text-center align-middle">
                                    {row["modelInfo"]["Model_Name"]}
                                  </td>
                                  <td className="text-center align-middle">
                                  {predictionKeys.length > 0 ? (
                                  predictionKeys.map((key, index) => (
                                    <span key={index}>
                                      {row[key]["name"]}
                                      {predictionKeys.length - 1 !== index && <br />}
                                    </span>
                                  ))
                                ) : (
                                  <span>No Prediction</span>
                                )}
                                  </td>

                                  <td className="text-center align-middle">
                                  {predictionKeys.length > 0 ? (
                                    predictionKeys.map((key, index) => (
                                      <span key={index}>
                                        {row[key]["confidence"]}
                                        {predictionKeys.length - 1 !== index && <br />}
                                      </span>
                                    ))
                                  ) : (
                                    <span>-</span>
                                  )}
                                  </td>
                                  <td className="text-center align-middle">
                                    {row["currentDate"]}
                                  </td>

                                  {/* View more Button 
                                  <td className="text-center align-middle">
                                    <Button
                                      id="Popover1"
                                      className="btn-icon mb-3 mb-sm-0"
                                      color="info"
                                    >
                                      <span className="btn-inner--text">
                                        View
                                      </span>
                                    </Button>
                                    <UncontrolledTooltip
                                      delay={0}
                                      placement="top"
                                      target="Popover1"
                                      trigger="hover focus"
                                    >
                                      Show detailed output
                                    </UncontrolledTooltip>

                                    <UncontrolledPopover
                                      placement="right"
                                      target="Popover1"
                                      trigger="click"
                                    >
                                      <PopoverHeader>
                                        Prediction Details
                                      </PopoverHeader>
                                      <PopoverBody>
                                        {row["prediction"]}
                                      </PopoverBody>
                                    </UncontrolledPopover>
                                  </td> */}
                                </tr>
                              )
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              className="text-center"
                              colSpan="10"
                              scope="row"
                            >
                              <h1>No Record Found</h1>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
              <Pagination
                  className="pagination justify-content-center"
                  listClassName="justify-content-center"
                >
                  {/* Previous Page Button */}
                  <PaginationItem disabled={selectedPage === 1}>
                    <PaginationLink
                      href="#pablo"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedPage(Math.max(selectedPage - 1, 1));
                      }}
                    >
                      <i className="fa fa-angle-left" />
                      <span className="sr-only">Previous</span>
                    </PaginationLink>
                  </PaginationItem>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.ceil(data.length / noPerPage) }, (_, i) => i + 1).map(pageNumber => (
                    <PaginationItem key={"page" + pageNumber} className={selectedPage === pageNumber ? "active" : ""}>
                      <PaginationLink
                        href="#pablo"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  {/* Next Page Button */}
                  <PaginationItem disabled={selectedPage === Math.ceil(data.length / noPerPage)}>
                    <PaginationLink
                      href="#pablo"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedPage(Math.min(selectedPage + 1, Math.ceil(data.length / noPerPage)));
                      }}
                    >
                      <i className="fa fa-angle-right" />
                      <span className="sr-only">Next</span>
                    </PaginationLink>
                  </PaginationItem>
                </Pagination>
              </Col>
            </Row>
          </Container>
        </section>
      </main>
    </>
  );
}

export default HistoryTable;
