import React from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
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
} from "reactstrap";

// Core components
import DemoNavbar from "components/Navbars/DemoNavbar.js";
import CardsFooter from "components/Footers/CardsFooter.js";

// Images
import SegmentationCover1 from "assets/img/Coverpage/SegmentationCover1.png";
import SegmentationCover2 from "assets/img/Coverpage/SegmentationCover2.png";
import OutputCaroCover from "assets/img/theme/OutputCaroCover.jpeg";

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

let outputCaro = [
  // Display outputs
  {
    src: OutputCaroCover,
    altText: "Input and processed images",
    header: "",
    caption: "",
  },
];

let userSelection = {
  inputImage: null,
  model_id: null,
  classification: {
    environment: null,
    model: null,
  },
  segmentation: {
    environment: null,
    model: null,
  },
};

class Landing extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showWebcamModal: false,
      capturedImage: null,

      tensorflowClassificationModels: [],
      pytorchClassificationModels: [],
      tensorflowSegmentationModels: [],
      pytorchSegmentationModels: [],
    };
  }

  // Default functions
  toggleModal = (state) => {
    this.setState({
      [state]: !this.state[state],
    });
  };

  // Image input functions
  handleFileUpload = (event) => {
    const file = event.target.files[0]; // Get selected file
    console.log("Selected file:", file.name);

    // Show in carousel
    this.handleOutputCaro(URL.createObjectURL(file), 1);
  };
  toggleWebcamModal = () => {
    this.setState({
      showWebcamModal: !this.state.showWebcamModal,
    });
  };
  handleCaptureImage = () => {
    const imageSrc = this.webcamRef.getScreenshot();

    // Show in carousel
    this.handleOutputCaro(imageSrc, 1);
  };
  handleOutputCaro = (image, index) => {
    // Create a new image object and add it to the outputCaro array
    const newImage = {
      src: image,
      altText: "Input Image",
      header: "",
      caption: "",
    };

    // Update in dict to parse into backend
    userSelection["inputImage"] = image;

    // Check if there's already an image at index
    if (outputCaro.length >= index + 1) {
      outputCaro[index] = newImage;
    } else {
      outputCaro.push(newImage);
    }

    // Update the state to re-render the component
    this.setState({ capturedImage: newImage });
  };

  // // User selection functions (Model & Environment)
  // handleSelection = (ai, environment, name) => {
  //   // eg. ai -> classification, environment -> pytorch, name -> yolo
  //   if (ai == null && environment == null && name == null) {
  //     // Reset everything to null
  //     userSelection["inputImage"] = null;
  //     userSelection["classification"]["environment"] = null;
  //     userSelection["classification"]["model"] = null;
  //     userSelection["segmentation"]["environment"] = null;
  //     userSelection["segmentation"]["model"] = null;

  //     this.forceUpdate(); // Refresh. Otherwise div not updated
  //   } else {
  //     userSelection[ai]["environment"] = environment;
  //     userSelection[ai]["model"] = name;
  //   }
  //   console.log(userSelection);
  // };

  // User selection functions (Model & Environment)
  handleSelection = (model_id) => {
    // eg. ai -> classification, environment -> pytorch, name -> yolo
    if (model_id == null) {
      // Reset everything to null
      userSelection["inputImage"] = null;
      userSelection["model_id"] = null;

      this.forceUpdate(); // Refresh. Otherwise div not updated
    } else {
      userSelection["model_id"] = model_id;
    }
    console.log(userSelection);
  };

  // Output
  handlePredict = async () => {
    console.log("This goes to backend", userSelection);

    // Validation check
    if (
      // (
      userSelection["inputImage"] == null
      //   &&
      //   userSelection["classification"]["model"] == null) ||
      // userSelection["classification"]["environment"] == null
    ) {
      alert("Please upload image and select model with environment!");
    }
    // else if (
    //   (userSelection["inputImage"] == null &&
    //     userSelection["segmentation"]["model"] == null) ||
    //   userSelection["segmentation"]["environment"] == null
    // ) {
    //   alert("Please upload image and select model with environment!");
    // } else if (
    //   (userSelection["classification"]["model"] == null ||
    //     userSelection["classification"]["environment"] == null) &&
    //   (userSelection["segmentation"]["model"] == null ||
    //     userSelection["segmentation"]["environment"] == null)
    // ) {
    //   alert("Please select model with environment!");
    // } else if (userSelection["inputImage"] == null) {
    //   alert("Please upload image!");
    // }
    else {
      // If all works
      try {
        // Send a POST request to the backend API with userSelection data

        console.log(userSelection);
        const response = await axios.post(
          `${BACKEND_URL}/user-selection`,
          userSelection
        );

        // Handle the response from the backend (if needed)
        console.log("Response from backend:", response.data);
      } catch (error) {
        // Handle any errors that occur during the POST request
        console.error("Error sending user selection data:", error);
      }
    }

    // Update Output Caro
    this.handleOutputCaro(response.data["outputImage"], 2);
  };

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
    const stateKey = `${modelType}${
      framework.charAt(0).toUpperCase() + framework.slice(1)
    }Models`;

    // Update the state dynamically based on the model type and framework
    this.setState({ [stateKey]: models });
  }

  handleModelUpload = async (ai, environment) => {
    // console.log(`This goes to backend\nAI: ${ai}\tEnvironment: ${environment}`);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      try {
        console.log(
          `Uploaded file: ${file}\nai: ${ai}\nEnvironment: ${environment}`
        );

        const modelInfo = {
          ai: ai,
          environment: environment,
          model: file,
        };

        console.log("Input into backend", modelInfo);
        const response = await axios.post(`${BACKEND_URL}/upload-model`);

        // Handle the response from the backend (if needed)
        console.log("Response from backend:", response.data);
      } catch (error) {
        // Handle any errors that occur during the POST request
        console.error("Error sending user selection data:", error);
      }
    };

    input.click();
  };

  render() {
    const {
      tensorflowClassificationModels,
      pytorchClassificationModels,
      tensorflowSegmentationModels,
      pytorchSegmentationModels,
    } = this.state;
    
    console.log(tensorflowClassificationModels,
      pytorchClassificationModels,
      tensorflowSegmentationModels,
      pytorchSegmentationModels)

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
                        Defect Detection
                      </h1>
                      <p className="lead text-white">
                        AI plays a crucial role in quality control and assurance
                        in manufacturing processes.
                        <br />
                        <br />
                        Based on certain characteristics, the type of defect of
                        each product is classified. Defect-relevant regions are
                        segmented and selected features are extracted.
                      </p>
                      <div className="btn-wrapper">
                        <Button
                          className="btn-icon mb-3 mb-sm-0"
                          color="info"
                          href="#"
                        >
                          <span className="btn-inner--icon mr-1">
                            <i className="fa fa-code" />
                          </span>
                          <span className="btn-inner--text">Try Now!</span>
                        </Button>
                      </div>
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
          </div>
          <section className="section section-lg">
            <Container>
              <Row className="row-grid align-items-center">
                <Col lg="3">
                  <div
                    className="d-flex flex-lg-column flex-wrap align-items-center justify-content-center"
                    style={{ gap: 1.5 + "rem" }}
                  >
                    <Button
                      className="btn-icon mb-3 mb-sm-0 mr-0"
                      color="info"
                      style={{ width: "200px" }}
                      onClick={() => this.toggleModal("Modal_SelectInput")}
                    >
                      <span className="btn-inner--icon mr-1">
                        <i className="fa fa-picture-o" />
                      </span>
                      <span className="btn-inner--text">Select Input</span>
                    </Button>
                    <Modal
                      className="modal-dialog-centered"
                      isOpen={this.state.Modal_SelectInput}
                      toggle={() => this.toggleModal("Modal_SelectInput")}
                    >
                      <div className="modal-header">
                        <h6 className="modal-title" id="modal-title-default">
                          Select upload
                        </h6>
                        <button
                          aria-label="Close"
                          className="close"
                          data-dismiss="modal"
                          type="button"
                          onClick={() => this.toggleModal("Modal_SelectInput")}
                        >
                          <span aria-hidden={true}>×</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <p className="m-0">
                          Choose between uploading from local device or using
                          camera
                        </p>
                      </div>
                      <div className="modal-footer">
                        {/* Camera */}
                        <Button
                          color="primary"
                          type="button"
                          onClick={this.toggleWebcamModal}
                        >
                          <span className="btn-inner--icon mr-1">
                            <i className="fa fa-camera" />
                          </span>
                          <span className="btn-inner--text">Camera</span>
                        </Button>

                        <Modal
                          className="modal-dialog-centered"
                          toggle={() => this.toggleModal("showWebcamModal")}
                          isOpen={this.state.showWebcamModal}
                          onRequestClose={this.toggleWebcamModal}
                        >
                          <div className="modal-header">
                            <h6
                              className="modal-title"
                              id="modal-title-default"
                            >
                              Capture Camera Image
                            </h6>
                            <button
                              aria-label="Close"
                              className="close"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal("showWebcamModal")
                              }
                            >
                              <span aria-hidden={true}>×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <Webcam
                              audio={false}
                              ref={(ref) => (this.webcamRef = ref)}
                              style={{ width: "100%", height: "100%" }}
                            />
                          </div>
                          <div className="modal-footer">
                            <Button
                              color="primary"
                              type="button"
                              onClick={this.handleCaptureImage}
                            >
                              <span className="btn-inner--icon mr-1">
                                <i className="fa fa-camera" />
                              </span>
                              <span className="btn-inner--text">Capture</span>
                            </Button>
                            <Button
                              color="primary"
                              type="button"
                              className="ml-auto"
                            >
                              <span className="btn-inner--icon mr-1">
                                <i className="fa fa-camera" />
                              </span>
                              <span className="btn-inner--text">Switch</span>
                            </Button>
                            <Button
                              className="ml-auto"
                              color="link"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal("showWebcamModal")
                              }
                            >
                              Close
                            </Button>
                          </div>
                        </Modal>

                        {/* Upload */}
                        <input
                          type="file"
                          id="fileInput"
                          onChange={this.handleFileUpload}
                          hidden
                        />
                        <Button
                          color="primary"
                          type="button"
                          className="ml-auto"
                        >
                          <label for="fileInput" className="m-0">
                            <span className="btn-inner--icon mr-1">
                              <i className="fa fa-upload" />
                            </span>
                            <span className="btn-inner--text">Upload</span>
                          </label>
                        </Button>
                        <Button
                          className="ml-auto"
                          color="link"
                          data-dismiss="modal"
                          type="button"
                          onClick={() => this.toggleModal("Modal_SelectInput")}
                        >
                          Close
                        </Button>
                      </div>
                    </Modal>

                    <Button
                      className="btn-icon mb-3 mb-sm-0 mr-0"
                      color="info"
                      style={{ width: "200px" }}
                      onClick={() =>
                        this.toggleModal("Modal_SelectClassification")
                      }
                    >
                      <span className="btn-inner--icon mr-1">
                        <i className="ni ni-paper-diploma" />
                      </span>
                      <span className="btn-inner--text">Classification</span>
                    </Button>
                    <Modal
                      className="modal-dialog-centered"
                      isOpen={this.state.Modal_SelectClassification}
                      toggle={() =>
                        this.toggleModal("Modal_SelectClassification")
                      }
                    >
                      <div className="modal-header">
                        <h6 className="modal-title" id="modal-title-default">
                          Select Classification Model
                        </h6>
                        <button
                          aria-label="Close"
                          className="close"
                          data-dismiss="modal"
                          type="button"
                          onClick={() =>
                            this.toggleModal("Modal_SelectClassification")
                          }
                        >
                          <span aria-hidden={true}>×</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <Media
                          className="d-flex align-items-center mb-3"
                          onClick={() =>
                            this.toggleModal(
                              "Modal_TensorflowModelsClassification"
                            )
                          }
                        >
                          <div className="icon icon-shape bg-gradient-warning rounded-circle text-white">
                            <svg
                              role="img"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <title>TensorFlow</title>
                              <path
                                d="M1.292 5.856L11.54 0v24l-4.095-2.378V7.603l-6.168 3.564.015-5.31zm21.43 5.311l-.014-5.31L12.46 0v24l4.095-2.378V14.87l3.092 1.788-.018-4.618-3.074-1.756V7.603l6.168 3.564z"
                                fill="white"
                              />
                            </svg>
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              Tensorflow
                            </h6>
                          </Media>
                        </Media>

                        <Modal
                          className="modal-dialog-centered"
                          toggle={() =>
                            this.toggleModal(
                              "Modal_TensorflowModelsClassification"
                            )
                          }
                          isOpen={
                            this.state.Modal_TensorflowModelsClassification
                          }
                        >
                          <div className="modal-header">
                            <h6
                              className="modal-title"
                              id="modal-title-default"
                            >
                              Tensorflow Models
                            </h6>
                            <button
                              aria-label="Close"
                              className="close"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_TensorflowModelsClassification"
                                )
                              }
                            >
                              <span aria-hidden={true}>×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <ul>
                              {tensorflowClassificationModels.map((model) => (
                                <div>
                                  <Media
                                    className="d-flex align-items-center mb-3"
                                    onClick={() => {
                                      this.handleSelection(model.model_id);
                                      this.toggleModal(
                                        "Modal_TensorflowModelsClassification"
                                      );
                                    }}
                                  >
                                    <div className="icon icon-shape bg-gradient-warning rounded-circle text-white">
                                      <svg
                                        role="img"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <title>TensorFlow</title>
                                        <path
                                          d="M1.292 5.856L11.54 0v24l-4.095-2.378V7.603l-6.168 3.564.015-5.31zm21.43 5.311l-.014-5.31L12.46 0v24l4.095-2.378V14.87l3.092 1.788-.018-4.618-3.074-1.756V7.603l6.168 3.564z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                    <Media body className="ml-3">
                                      <h6
                                        key={model.Model_Name || index}
                                        className="description d-none d-inline-block mb-0"
                                      >
                                        {model.Model_Name}
                                      </h6>
                                    </Media>
                                  </Media>
                                </div>
                              ))}
                            </ul>
                          </div>
                          <div className="modal-footer">
                            <Button
                              color="primary"
                              type="button"
                              onClick={() => {
                                this.handleModelUpload(
                                  "classification",
                                  "tensorflow"
                                );
                              }}
                            >
                              Add model
                            </Button>
                            <Button
                              className="ml-auto"
                              color="link"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_TensorflowModelsClassification"
                                )
                              }
                            >
                              Close
                            </Button>
                          </div>
                        </Modal>

                        <Media
                          className="d-flex align-items-center"
                          onClick={() =>
                            this.toggleModal(
                              "Modal_PytorchModelsClassification"
                            )
                          }
                        >
                          <div className="icon icon-shape bg-gradient-danger rounded-circle text-white">
                            {/* <i className="ni ni-caps-small" /> */}
                            <svg
                              role="img"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <title>PyTorch</title>
                              <path
                                d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"
                                fill="white"
                              />
                            </svg>
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              Pytorch
                            </h6>
                          </Media>
                        </Media>

                        <Modal
                          className="modal-dialog-centered"
                          toggle={() =>
                            this.toggleModal(
                              "Modal_PytorchModelsClassification"
                            )
                          }
                          isOpen={this.state.Modal_PytorchModelsClassification}
                        >
                          <div className="modal-header">
                            <h6
                              className="modal-title"
                              id="modal-title-default"
                            >
                              Pytorch Models
                            </h6>
                            <button
                              aria-label="Close"
                              className="close"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_PytorchModelsClassification"
                                )
                              }
                            >
                              <span aria-hidden={true}>×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <ul>
                              {pytorchClassificationModels.map((model) => (
                                <div>
                                  <Media
                                    className="d-flex align-items-center mb-3"
                                    onClick={() => {
                                      this.handleSelection(model.mnodel_id);
                                      this.toggleModal(
                                        "Modal_PytorchModelsClassification"
                                      );
                                    }}
                                  >
                                    <div className="icon icon-shape bg-gradient-danger rounded-circle text-white">
                                      <svg
                                        role="img"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <title>PyTorch</title>
                                        <path
                                          d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                    <Media body className="ml-3">
                                      <h6
                                        key={model.Model_Name || index}
                                        className="description d-none d-inline-block mb-0"
                                      >
                                        {model.Model_Name}
                                      </h6>
                                    </Media>
                                  </Media>
                                </div>
                              ))}
                            </ul>
                          </div>
                          <div className="modal-footer">
                            <Button
                              color="primary"
                              type="button"
                              onClick={() => {
                                this.handleModelUpload(
                                  "classification",
                                  "pytorch"
                                );
                              }}
                            >
                              Add model
                            </Button>
                            <Button
                              className="ml-auto"
                              color="link"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_PytorchModelsClassification"
                                )
                              }
                            >
                              Close
                            </Button>
                          </div>
                        </Modal>
                      </div>
                      <div className="modal-footer">
                        <Button
                          className="ml-auto"
                          color="link"
                          data-dismiss="modal"
                          type="button"
                          onClick={() =>
                            this.toggleModal("Modal_SelectClassification")
                          }
                        >
                          Close
                        </Button>
                      </div>
                    </Modal>

                    <Button
                      className="btn-icon mb-3 mb-sm-0 mr-0"
                      color="info"
                      style={{ width: "200px" }}
                      onClick={() =>
                        this.toggleModal("Modal_SelectSegmentation")
                      }
                    >
                      <span className="btn-inner--icon mr-1">
                        <i className="fa fa-scissors" />
                      </span>
                      <span className="btn-inner--text">Segmentation</span>
                    </Button>
                    <Modal
                      className="modal-dialog-centered"
                      isOpen={this.state.Modal_SelectSegmentation}
                      toggle={() =>
                        this.toggleModal("Modal_SelectSegmentation")
                      }
                    >
                      <div className="modal-header">
                        <h6 className="modal-title" id="modal-title-default">
                          Select Segmentation Model
                        </h6>
                        <button
                          aria-label="Close"
                          className="close"
                          data-dismiss="modal"
                          type="button"
                          onClick={() =>
                            this.toggleModal("Modal_SelectSegmentation")
                          }
                        >
                          <span aria-hidden={true}>×</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <Media
                          className="d-flex align-items-center mb-3"
                          onClick={() =>
                            this.toggleModal(
                              "Modal_TensorflowModelsSegmentation"
                            )
                          }
                        >
                          <div className="icon icon-shape bg-gradient-warning rounded-circle text-white">
                            <svg
                              role="img"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <title>TensorFlow</title>
                              <path
                                d="M1.292 5.856L11.54 0v24l-4.095-2.378V7.603l-6.168 3.564.015-5.31zm21.43 5.311l-.014-5.31L12.46 0v24l4.095-2.378V14.87l3.092 1.788-.018-4.618-3.074-1.756V7.603l6.168 3.564z"
                                fill="white"
                              />
                            </svg>
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              Tensorflow
                            </h6>
                          </Media>
                        </Media>

                        <Modal
                          className="modal-dialog-centered"
                          toggle={() =>
                            this.toggleModal(
                              "Modal_TensorflowModelsSegmentation"
                            )
                          }
                          isOpen={this.state.Modal_TensorflowModelsSegmentation}
                        >
                          <div className="modal-header">
                            <h6
                              className="modal-title"
                              id="modal-title-default"
                            >
                              Tensorflow Models
                            </h6>
                            <button
                              aria-label="Close"
                              className="close"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_TensorflowModelsSegmentation"
                                )
                              }
                            >
                              <span aria-hidden={true}>×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <ul>
                              {tensorflowSegmentationModels.map((model) => (
                                <div>
                                  <Media
                                    className="d-flex align-items-center mb-3"
                                    onClick={() => {
                                      this.handleSelection(model.model_id);
                                      this.toggleModal(
                                        "Modal_TensorflowModelsSegmentation"
                                      );
                                    }}
                                  >
                                    <div className="icon icon-shape bg-gradient-warning rounded-circle text-white">
                                      <svg
                                        role="img"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <title>TensorFlow</title>
                                        <path
                                          d="M1.292 5.856L11.54 0v24l-4.095-2.378V7.603l-6.168 3.564.015-5.31zm21.43 5.311l-.014-5.31L12.46 0v24l4.095-2.378V14.87l3.092 1.788-.018-4.618-3.074-1.756V7.603l6.168 3.564z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                    <Media body className="ml-3">
                                      <h6
                                        key={model.Model_Name || index}
                                        className="description d-none d-inline-block mb-0"
                                      >
                                        {model.Model_Name}
                                      </h6>
                                    </Media>
                                  </Media>
                                </div>
                              ))}
                            </ul>
                          </div>
                          <div className="modal-footer">
                            <Button
                              color="primary"
                              type="button"
                              onClick={() => {
                                this.handleModelUpload(
                                  "segmentation",
                                  "tensorflow"
                                );
                              }}
                            >
                              Add model
                            </Button>
                            <Button
                              className="ml-auto"
                              color="link"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_TensorflowModelsSegmentation"
                                )
                              }
                            >
                              Close
                            </Button>
                          </div>
                        </Modal>

                        <Media
                          className="d-flex align-items-center"
                          onClick={() =>
                            this.toggleModal("Modal_PytorchModelsSegmentation")
                          }
                        >
                          <div className="icon icon-shape bg-gradient-danger rounded-circle text-white">
                            {/* <i className="ni ni-caps-small" /> */}
                            <svg
                              role="img"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <title>PyTorch</title>
                              <path
                                d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"
                                fill="white"
                              />
                            </svg>
                          </div>
                          <Media body className="ml-3">
                            <h6 className="heading text-primary mb-md-1">
                              Pytorch
                            </h6>
                          </Media>
                        </Media>

                        <Modal
                          className="modal-dialog-centered"
                          toggle={() =>
                            this.toggleModal("Modal_PytorchModelsSegmentation")
                          }
                          isOpen={this.state.Modal_PytorchModelsSegmentation}
                        >
                          <div className="modal-header">
                            <h6
                              className="modal-title"
                              id="modal-title-default"
                            >
                              Pytorch Models
                            </h6>
                            <button
                              aria-label="Close"
                              className="close"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_PytorchModelsSegmentation"
                                )
                              }
                            >
                              <span aria-hidden={true}>×</span>
                            </button>
                          </div>
                          <div className="modal-body">
                            <ul>
                              {pytorchSegmentationModels.map((model) => (
                                <div>
                                  <Media
                                    className="d-flex align-items-center mb-3"
                                    onClick={() => {
                                      this.handleSelection(model.model_id);
                                      this.toggleModal(
                                        "Modal_PytorchModelsSegmentation"
                                      );
                                    }}
                                  >
                                    <div className="icon icon-shape bg-gradient-danger rounded-circle text-white">
                                      <svg
                                        role="img"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <title>PyTorch</title>
                                        <path
                                          d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"
                                          fill="white"
                                        />
                                      </svg>
                                    </div>
                                    <Media body className="ml-3">
                                      <h6
                                        key={model.Model_Name || index}
                                        className="description d-none d-inline-block mb-0"
                                      >
                                        {model.Model_Name}
                                      </h6>
                                    </Media>
                                  </Media>
                                </div>
                              ))}
                            </ul>
                          </div>
                          <div className="modal-footer">
                            <Button
                              color="primary"
                              type="button"
                              onClick={() => {
                                this.handleModelUpload(
                                  "segmentation",
                                  "pytorch"
                                );
                              }}
                            >
                              Add model
                            </Button>
                            <Button
                              className="ml-auto"
                              color="link"
                              data-dismiss="modal"
                              type="button"
                              onClick={() =>
                                this.toggleModal(
                                  "Modal_PytorchModelsSegmentation"
                                )
                              }
                            >
                              Close
                            </Button>
                          </div>
                        </Modal>
                      </div>
                      <div className="modal-footer">
                        <Button
                          className="ml-auto"
                          color="link"
                          data-dismiss="modal"
                          type="button"
                          onClick={() =>
                            this.toggleModal("Modal_SelectSegmentation")
                          }
                        >
                          Close
                        </Button>
                      </div>
                    </Modal>

                    <Button
                      className="btn-icon mb-3 mb-sm-0 mr-0"
                      color="danger"
                      style={{ width: "200px" }}
                      onClick={() => this.handleSelection(null, null, null)}
                    >
                      <span className="btn-inner--icon mr-1">
                        <i className="fa fa-tag" />
                      </span>
                      <span className="btn-inner--text">Clear Selection</span>
                    </Button>

                    <Button
                      className="btn-icon mb-3 mb-sm-0 mr-0"
                      color="warning"
                      style={{ width: "200px" }}
                      onClick={() => this.handlePredict()}
                    >
                      <span className="btn-inner--icon mr-1">
                        <i className="fa fa-tag" />
                      </span>
                      <span className="btn-inner--text">Predict</span>
                    </Button>
                  </div>
                </Col>
                <Col lg="9">
                  <div className="d-flex flex-lg-column flex-wrap align-items-center justify-content-center mb-3">
                    {/* <div>
                      <span>Classification: </span>
                      <span>
                        {userSelection.classification.model == null
                          ? "No model selected"
                          : userSelection.classification.model}
                      </span>
                      <span>
                        (
                        {userSelection.classification.environment == null
                          ? "No environment selected"
                          : userSelection.classification.environment}
                        )
                      </span>
                    </div>

                    <div>
                      <span>Segmentation: </span>
                      <span>
                        {userSelection.segmentation.model == null
                          ? "No model selected"
                          : userSelection.segmentation.model}
                      </span>
                      <span>
                        (
                        {userSelection.segmentation.environment == null
                          ? "No environment selected"
                          : userSelection.segmentation.environment}
                        )
                      </span>
                    </div> */}
                  </div>
                  <div className="rounded shadow-lg overflow-hidden">
                    <UncontrolledCarousel items={outputCaro} />
                  </div>
                </Col>
              </Row>
            </Container>
          </section>
          <section className="section bg-secondary">
            <Container>
              <Row className="row-grid">
                <Col lg="3">
                  <h1 className="display-3">Evaluation</h1>
                  <Button className="btn-icon mb-3 mb-sm-0 mr-0" color="info">
                    <Link to="/History">
                      <span className="btn-inner--text text-white">
                        View History
                      </span>
                    </Link>
                  </Button>
                </Col>
                <Col lg="9">
                  <h5>
                    <strong>Metrics</strong>
                  </h5>
                  <div className="table-responsive">
                    <div>
                      <table className="table align-items-center">
                        <thead className="thead-light">
                          <tr>
                            <th scope="col" className="sort" data-sort="name">
                              IoU
                            </th>
                            <th scope="col" className="sort" data-sort="budget">
                              Dice Coefficient
                            </th>
                            <th scope="col" className="sort" data-sort="status">
                              mIoU
                            </th>
                            <th
                              scope="col"
                              className="sort"
                              data-sort="completion"
                            >
                              F1
                            </th>
                            <th scope="col" className="sort" data-sort="status">
                              Precision
                            </th>
                            <th scope="col" className="sort" data-sort="status">
                              Recall
                            </th>
                          </tr>
                        </thead>
                        <tbody className="list">
                          <tr>
                            <td scope="row">$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                          </tr>
                          <tr>
                            <td scope="row">$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                          </tr>
                          <tr>
                            <td scope="row">$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                            <td>$2500 USD</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="background-box"></div>
                </Col>
              </Row>
            </Container>
          </section>
        </main>
        <CardsFooter />
      </>
    );
  }
}

export default Landing;
