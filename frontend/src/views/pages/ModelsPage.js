import React from "react";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import "assets/css/modelBoxes.css"; // Import a custom CSS file for styling

// reactstrap components
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardImg,
  FormGroup,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  Container,
  Row,
  Col,
  Media,
  Modal,
  UncontrolledCarousel,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

// Core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import CardsFooter from "components/Footers/CardsFooter.js";

// Images
import SegmentationCover1 from "assets/img/Coverpage/SegmentationCover1.png";
import SegmentationCover2 from "assets/img/Coverpage/SegmentationCover2.png";

const BACKEND_URL = "http://localhost:8080";

// Variables to be referenced to
const headerCaro = [
  {
    src: SegmentationCover1,
    altText: "Panoptic Segmentation",
    header: "",
    caption: "",
  },
  {
    src: SegmentationCover2,
    altText: "Semantic Segmentation",
    header: "",
    caption: "",
  },
];

class Landing extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showWebcamModal: false,
      capturedImage: null,
      all_model: [],
      searchQuery: "",
      // sortAscending: true,
      sortOption: "NameAscending",
    };
  }

  // Default functions
  componentDidMount = () => {
    // Reset scroll to top
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    this.refs.main.scrollTop = 0;

    // Define model types and frameworks
    const modelTypes = ["pytorch", "tensorflow"];
    const frameworks = ["classification", "segmentation"];

    // Fetch data for all combinations of model types and frameworks
    modelTypes.forEach((modelType) => {
      frameworks.forEach((framework) => {
        this.fetchAndSetModels(modelType, framework);
      });
    });
  };

  /* GET Models */
  async fetchModels(modelType, framework) {
    try {
      // Here, BACKEND_URL is the base URL for your backend
      // We append the /models endpoint and include the type and version as query parameters
      const response = await fetch(
        `${BACKEND_URL}/models?type=${modelType}&version=${framework}`
      );
      if (response.ok) {
        const models = await response.json();
        console.log(`Fetched ${modelType} ${framework} Models:`, models);
        return models;
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      return [];
    }
  }

  async fetchAndSetModels(modelType, framework) {
    const models = await this.fetchModels(modelType, framework);

    // Append the fetched models to the existing models in state
    this.setState(
      (prevState) => ({
        all_model: [...prevState.all_model, ...models],
      }),
      () => {
        // Log the updated state
        console.log(this.state.all_model);
      }
    );
  }

  /* Filter models */
  handleSearchChange = (event) => {
    this.setState({ searchQuery: event.target.value });
  };

  /* Sort models */
  handleSortChange = (event) => {
    this.setState({ sortOption: event.target.value });
  };

  render() {
    const { all_model } = this.state;

    return (
      <>
        <DemoNavbar />
        <main ref="main">
          <div className="position-relative">
            <section className="section section-lg section-shaped pb-150">
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
                        <span>&nbsp;</span>
                        Models
                      </h1>
                      <p className="lead text-white">
                        Discover amazing ML apps including Segmentation, Object
                        Detection, and OCR from our repository! Alternatively,
                        you can upoad your own custom built model!
                      </p>
                    </Col>
                    {/* Carousel */}
                    <Col
                      lg="6"
                      className="d-flex flex-lg-column flex-wrap align-items-center justify-content-center"
                    >
                      <div className="p-4">
                        <div className="rounded shadow-lg overflow-hidden transform-perspective-right">
                          <UncontrolledCarousel items={headerCaro} />
                        </div>
                      </div>
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
          <section className="section section-lg">
            {/* User filter results */}
            <Row className="justify-content-center mb-3 px-3">
              <Col sm="10" md="8" lg="6">
                {/* Search bar */}
                <Input
                  type="text"
                  placeholder="Search Models"
                  value={this.state.searchQuery}
                  onChange={this.handleSearchChange}
                  className="mb-3"
                />
                {/* Sort dropdown */}
                <UncontrolledDropdown>
                  <DropdownToggle caret>Sort Models</DropdownToggle>
                  <DropdownMenu>
                    <DropdownItem
                      onClick={() =>
                        this.handleSortChange({
                          target: { value: "NameAscending" },
                        })
                      }
                    >
                      <span className="dropdown-item-text">A-Z</span>
                      <span className="dropdown-item-tick">
                        {this.state.sortOption === "NameAscending" && "✓"}
                      </span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        this.handleSortChange({
                          target: { value: "NameDescending" },
                        })
                      }
                    >
                      <span className="dropdown-item-text">Z-A</span>
                      <span className="dropdown-item-tick">
                        {this.state.sortOption === "NameDescending" && "✓"}
                      </span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        this.handleSortChange({
                          target: { value: "TypeAscending" },
                        })
                      }
                    >
                      <span className="dropdown-item-text">Type ↑</span>
                      <span className="dropdown-item-tick">
                        {this.state.sortOption === "TypeAscending" && "✓"}
                      </span>
                    </DropdownItem>
                    <DropdownItem
                      onClick={() =>
                        this.handleSortChange({
                          target: { value: "TypeDescending" },
                        })
                      }
                    >
                      <span className="dropdown-item-text">Type ↓</span>
                      <span className="dropdown-item-tick">
                        {this.state.sortOption === "TypeDescending" && "✓"}
                      </span>
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </Col>
            </Row>

            <Container>
              <h3>Segmentation</h3>
              <Row>{this.renderBoxes("segmentation")}</Row>
              <h3 className="mt-5">Classification</h3>
              <Row>{this.renderBoxes("classification")}</Row>
            </Container>
          </section>
        </main>
        <CardsFooter />
      </>
    );
  }

  renderBox(box) {
    return (
      <Link
        to={`/model/${box._id}`}
        className="custom-box-container custom-container custom-box"
      >
        <div className="border shadow-md bg-white flex flex-col items-center p-5 rounded-xl border-gray-200 custom-box ">
          {box.Model_Type == "pytorch" ? (
            <div style={{ marginBottom: "25px" }}>
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
              >
                <title>PyTorch</title>
                <path
                  d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"
                  fill="red"
                />
              </svg>
            </div>
          ) : (
            <div style={{ marginBottom: "25px" }}>
              <svg
                role="img"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                width="50"
                height="50"
              >
                <title>TensorFlow</title>
                <path
                  d="M1.292 5.856L11.54 0v24l-4.095-2.378V7.603l-6.168 3.564.015-5.31zm21.43 5.311l-.014-5.31L12.46 0v24l4.095-2.378V14.87l3.092 1.788-.018-4.618-3.074-1.756V7.603l6.168 3.564z"
                  fill="orange"
                />
              </svg>
            </div>
          )}
          <h2 className="text-black text-lg mb-2 text-sm text-center">
            {box.Model_Name}
          </h2>
          <p className="text-gray-600 text-left leading-relaxed text-xs text-center">
            {box.Model_Version}
          </p>
        </div>
      </Link>
    );
  }

  renderBoxes(modelType) {
    const { all_model, searchQuery, sortOption } = this.state; // Retrieve all_model from the state

    const filteredModels = all_model.filter(
      (box) =>
        box.Model_Version === modelType &&
        (box.Model_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          box.Model_Type.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filteredModels.sort((a, b) => {
      if (sortOption === "NameAscending") {
        return a.Model_Name.localeCompare(b.Model_Name);
      } else if (sortOption === "NameDescending") {
        return b.Model_Name.localeCompare(a.Model_Name);
      } else if (sortOption === "TypeAscending") {
        return a.Model_Type.localeCompare(b.Model_Type);
      } else {
        return b.Model_Type.localeCompare(a.Model_Type);
      }
    });

    // Check if all_model is not empty
    if (!filteredModels || filteredModels.length === 0) {
      return <p>No models found.</p>; // Return an empty array if there are no models
    }

    // Map over all_model and render each box
    return filteredModels.map((box, index) => (
      <Col key={index} lg="4" md="6" sm="12">
        {this.renderBox(box)}
      </Col>
    ));
  }
}

export default Landing;
