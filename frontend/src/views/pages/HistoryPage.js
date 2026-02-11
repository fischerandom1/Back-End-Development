import { useState, useEffect } from "react";
import { atom, useAtom } from "jotai";
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
  ButtonDropdown,
} from "reactstrap";

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import CardsFooter from "components/Footers/CardsFooter.js";
import Tabs from "components/Tabs.js";
import HistoryTable from "components/History/HistoryTable";

const BACKEND_URL = "http://localhost:8080";

const tabs = [
  {
    id: 1,
    name: "OCR",
    // content: <OCR />,
    url: "/ARTC/ocr_exp.json",
  },
  {
    id: 2,
    name: "Classification",
    // content: <CLASSIFICATION />,
    url: "/ARTC/classification_exp.json",
  },
  {
    id: 3,
    name: "Segmentation",
    // content: <SEGMENTATION />,
    url: "/ARTC/seg_exp.json",
  },
];

export const selectedTabAtom = atom(tabs[0].id);

function HistoryPage() {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);

  const [sortColumn, setSortColumn] = useState();
  const [sortDirection, setSortDirection] = useState();
  const [selectedTab, _] = useAtom(selectedTabAtom);

  // Fetch the prediction history when the component mounts
  useEffect(() => {
    // Call the API to fetch predictions when the component mounts
    axios
      .get(`${BACKEND_URL}/prediction-history`)
      .then((response) => {
        // Assuming the API returns an array of predictions
        const fetchedData = response.data;
        console.log(response.data)
        setData(fetchedData);
        setOriginalData(fetchedData);
      })
      .catch((error) => {
        console.error("Error fetching predictions:", error);
        // You may want to set state to reflect an error occurred
      });

    // Set initial sort state
    setSortColumn("id");
    setSortDirection("asc");
  }, []);

  return (
    <>
      <DemoNavbar />
      <main>
        <div className="position-relative">
          {/* shape Hero */}
          <section className="section section-lg section-shaped pb-50">
            <div className="shape shape-style-1 shape-default">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <Container className="py-lg-md d-flex">
              <div className="col px-0">
                <Row>
                  <Col lg="6">
                    <h1 className="display-3 text-white">
                      History <span></span>
                    </h1>
                    <p className="lead text-white">
                      Past predictions are displayed here. Click view more to
                      have a detailed view
                    </p>
                  </Col>
                </Row>
              </div>
            </Container>
            {/* SVG separator */}
            <div className="separator separator-bottom separator-skew">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                version="1.1"
                viewBox="0 0 2560 100"
                x="0"
                y="0"
              >
                <polygon
                  className="fill-white"
                  points="2560 0 2560 100 0 100"
                />
              </svg>
            </div>
          </section>
          {/* 1st Hero Variation */}
        </div>
        <Container>
          <div
            className="d-flex flex-wrap align-items-center mb-4"
            style={{ gap: "20px" }}
          ></div>
          {/* <Tabs tabs={tabs} /> */}
        </Container>
      </main>
      <HistoryTable selectedData={data} />
      <CardsFooter />
    </>
  );
}

export default HistoryPage;
