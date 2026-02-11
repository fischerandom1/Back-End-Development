import { useState, useEffect } from "react";
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
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

// core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import CardsFooter from "components/Footers/CardsFooter.js";
import Tabs from "components/Tabs.js";
import BarChart from "components/Charts/BarChart.js";
import Histogram from "components/Charts/Histogram";

const BACKEND_URL = "http://localhost:8080";

// let OCR = () => {
//   return <div>OCR chart</div>;
// };

// let CLASSIFICATION = () => {
//   return <div>Classification chart</div>;
// };

// let SEGMENTATION = () => {
//   return <div>Segmentation charts</div>;
// };

function AnalyticsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [averageClassesData, setAverageClassesData] = useState([]);
  // const [currentTab, setCurrentTab] = useState(0);
  // const [tabs, setTabs] = useState([
  //   {
  //     id: 2,
  //     name: "Classification",
  //     content: <CLASSIFICATION />,
  //   },
  //   {
  //     id: 3,
  //     name: "Segmentation",
  //     content: <SEGMENTATION />,
  //   },
  // ]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const [chart1Data, setChart1Data] = useState([]);
  const [chart1Labels, setChart1Labels] = useState([]);
  const [chart1Title, setChart1Title] = useState("");

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/prediction-history`)
      .then((response) => {
        const data = response.data;
        let classCountsPerModel = {};
        data.forEach((record) => {
          if (record.modelInfo && record.modelInfo.Model_Name) {
            if (!classCountsPerModel[record.modelInfo.Model_Name]) {
              classCountsPerModel[record.modelInfo.Model_Name] = {
                count: 0,
                total: 0,
              };
            }
            let detectedClasses = Object.keys(record).filter(
              (key) => !isNaN(key)
            );
            classCountsPerModel[record.modelInfo.Model_Name].count +=
              detectedClasses.length;
            classCountsPerModel[record.modelInfo.Model_Name].total += 1;
          }
        });

        let averageClasses = Object.keys(classCountsPerModel).map(
          (modelName) => {
            let avg =
              classCountsPerModel[modelName].count /
              classCountsPerModel[modelName].total;
            return { modelName, avg };
          }
        );

        if (selectedOptions.length > 0) {
          averageClasses = averageClasses.filter(({ modelName }) =>
            selectedOptions.includes(modelName)
          );
        }
        setAverageClassesData(averageClasses);

        let models = new Set(data.map((e) => e.modelInfo["Model_Name"]));

        let newOptions = Array.from(models).map((model_name, index) => {
          return { id: index + 1, name: model_name };
        });

        setOptions(newOptions);
        let extractData = Array.from(models).map((model_name) => {
          let count = data.filter(
            (e) => e.modelInfo["Model_Name"] === model_name
          ).length;
          return { model_name, count };
        });

        // Update chart data based on selected options
        let chartLabels = [];
        let chartData = [];

        if (selectedOptions.length > 0) {
          // If specific models are selected
          chartLabels = selectedOptions;
          chartData = extractData
            .filter((e) => selectedOptions.includes(e.model_name))
            .map((e) => e.count);
        } else {
          // If no specific model is selected, show all
          chartLabels = Array.from(models);
          chartData = extractData.map((e) => e.count);
        }

        setChart1Labels(chartLabels);
        setChart1Data(chartData);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedOptions]);

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      // If the option is already selected, remove it
      setSelectedOptions(selectedOptions.filter((item) => item !== option));
    } else {
      // If the option is not selected, add it
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  useEffect(() => {
    if (selectedOptions.length === options.length) {
      setSelectedOptions([]);
      console.log(selectedOptions);
    }
  }, [selectedOptions]);

  return (
    <>
      <DemoNavbar />
      <main className="overflow-auto">
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
                      Analytics <span></span>
                    </h1>
                    <p className="lead text-white">
                      View model evaluations here, search through available
                      models and select a model to display metrics such as F1
                      Score, Evaluation Matrix, Accuracy and more.
                    </p>
                  </Col>
                </Row>
              </div>
            </Container>
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
        </div>
        <section className="section">
          <Container>
            <div
              className="d-flex flex-wrap align-items-center mb-4"
              style={{ gap: "20px" }}
            >
              <ButtonDropdown isOpen={isOpen} toggle={toggleDropdown}>
                <DropdownToggle caret>
                  {selectedOptions.length === 0 ||
                  selectedOptions.length === options.length
                    ? "All selected"
                    : selectedOptions.join(", ")}
                </DropdownToggle>
                <DropdownMenu>
                  {options.map((optionObj, idx) => {
                    return (
                      <DropdownItem
                        key={"option" + idx}
                        onClick={() => toggleOption(optionObj["name"])}
                        active={selectedOptions.includes(optionObj["name"])}
                      >
                        {optionObj["name"]}
                      </DropdownItem>
                    );
                  })}
                </DropdownMenu>
              </ButtonDropdown>
            </div>

            <BarChart
              labels={chart1Labels}
              chartData={chart1Data}
              titleName={chart1Title}
            />
            <Histogram 
            data={averageClassesData} />
          </Container>
        </section>
      </main>
      <CardsFooter />
    </>
  );
}

export default AnalyticsPage;
