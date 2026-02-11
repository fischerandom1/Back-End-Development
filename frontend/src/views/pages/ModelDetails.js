import React from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Link, useHistory } from "react-router-dom";
import "assets/css/modelBoxes.css"; // Import a custom CSS file for styling
import BarChart from "components/Charts/BarChart.js";
import LineChart from "components/Charts/LineChart.js";

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

const BACKEND_URL = "http://localhost:8080";

let userSelection = new FormData();

let predictedOutput = {
  // Display outputs
  src: "",
  altText: "Predicted Output",
  header: "",
  caption: "",
};

var outputResults = [{ name: "-", confidence: "-" }];

class Landing extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showWebcam: false,
      showWebcamModal: false,
      capturedImage: null,
      all_model: [],
      isCameraOn: false,
      textInput: "",
      lastClickedBoxId: null,
    };

    this.webcamRef = React.createRef();
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

    // Reset var to prevent leakage
    predictedOutput = {
      src: "",
      altText: "Predicted Output",
      header: "",
      caption: "",
    };

    outputResults = [{ name: "-", confidence: "-" }];
    userSelection = new FormData();
    this.setState({
      showWebcam: false,
      showWebcamModal: false,
      capturedImage: null,
      all_model: [],
      isCameraOn: false,
      textInput: "",
      lastClickedBoxId: null,
    });

    // For analyitcs; Jones to edit and make dynamic
    let modelData = this.fetchData();
  };

  /* Retrieve model info */
  getModelInfo() {
    const { all_model } = this.state; // Retrieve all_model from the state
    const model_id = this.getLastURLParameter(); // Get model ID to match model list

    // Check if all_model is not empty
    if (!all_model || all_model.length === 0) {
      return []; // Return an empty array if there are no models
    }

    // Match to correct model
    for (let i = 0; i < all_model.length; i++) {
      if (String(model_id) == String(all_model[i]._id)) {
        return all_model[i];
      }
    }
  }

  // Fetch data
  async fetchData() {
    try {
      // URL for backend
      const response = await fetch(
        "../ARTC/analytics_example.json"
      );
      // If response is good
      if (response.ok) {
        // Get data
        const data = await response.json();

        let model_id = this.getLastURLParameter();

        let models = data.map((e) => {
          return e["modelInfo"]["_id"].split('"')[1];
        });
        models = [...new Set(models)];

        const labels = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        let monthData = new Array(labels.length).fill(0);
        for (let info of data.filter((e) =>
          e["modelInfo"]["_id"].includes(model_id)
        )) {
          let created_date = new Date(info["modelInfo"]["CreatedTimestamp"]);
          let month = created_date.getMonth();
          let noOfRecord = Object.keys(info).filter(
            (n) => !isNaN(parseFloat(n)) && isFinite(n)
          );
          for (let no of noOfRecord) {
            monthData[month]++;
          }
        }
        this.setState({ labels, monthData });

        return { labels, monthData };
      } else {
        // else throw error
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      // console.error("Error fetching models:", error);
      return { labels: [], monthData: [] };
    }
  }

  /* GET API */
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

  componentDidUpdate(prevProps, prevState) {
    if (prevState.capturedImage !== this.state.capturedImage) {
      // Perform any actions needed when capturedImage changes
    }
  }

  componentWillUnmount() {
    if (this.state.capturedImage) {
      URL.revokeObjectURL(this.state.capturedImage);
    }
  }

  // Obtain Model ID
  getLastURLParameter = () => {
    const pathSegments = window.location.pathname.split("/");
    const lastSegment = pathSegments[pathSegments.length - 1];

    return lastSegment;
  };

  /* Camera */
  toggleWebcam = () => {
    this.setState((prevState) => {
      if (prevState.isCameraOn) {
        // Make sure the webcamRef is set before trying to capture an image
        const imageSrc = this.webcamRef.current
          ? this.webcamRef.current.getScreenshot()
          : null;

        if (imageSrc) {
          // Convert the imageSrc, which is a data URL, to a Blob
          fetch(imageSrc)
            .then((res) => res.blob())
            .then((blob) => {
              userSelection = new FormData();
              userSelection.append(
                "inputImage",
                blob,
                `${this.getLastURLParameter()}_${Date.now()}_Camera.jpg`
              );
              userSelection.append("model_id", this.getLastURLParameter());
              // For example, append it to the FormData if needed
              // Update state with the Blob URL to display the captured image
              const capturedBlobUrl = URL.createObjectURL(blob);
              this.setState({
                capturedImage: capturedBlobUrl,
                isCameraOn: false, // Turn camera off after capturing the image
              });
            })
            .catch((error) =>
              console.error("Error converting imageSrc to Blob:", error)
            );
        }
        return {
          // capturedImage: imageSrc,
          isCameraOn: false, // Turn camera off after capturing the image
        };
      } else {
        return { isCameraOn: !prevState.isCameraOn };
      }
    });
  };

  handleCaptureImage = () => {
    if (this.webcamRef.current) {
      const imageSrc = this.webcamRef.current.getScreenshot();
      this.setState({
        capturedImage: imageSrc,
        isCameraOn: false, // Turn camera off after capturing the image
      });
    }
  };

  setWebcamRef = (webcam) => {
    this.webcamRef = webcam;
  };

  /* Text Query */
  handleTextInputChange = (event) => {
    this.setState({ textInput: event.target.value });
  };

  /* Upload file */
  handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log(file);
      let fileBuffer = await file.arrayBuffer();
      let fileBlob = new Blob([new Uint8Array(fileBuffer)], {
        type: file.type,
      });
      console.log(fileBlob);
      const fileURL = URL.createObjectURL(file);

      this.setState({
        isCameraOn: false,
        capturedImage: fileURL,
      });

      userSelection = new FormData();
      userSelection.append(
        "inputImage",
        fileBlob,
        `${this.getLastURLParameter()}_${Date.now()}_${file.name}`
      );
      userSelection.append("model_id", this.getLastURLParameter());
    } else {
      console.error("No file selected");
    }
  };

  handleDragFileUpload = async (file) => {
    console.log(file);
    let fileBuffer = await file.arrayBuffer();
    let fileBlob = new Blob([new Uint8Array(fileBuffer)], {
      type: file.type,
    });
    console.log(fileBlob);
    const fileURL = URL.createObjectURL(file);

    this.setState({
      capturedImage: fileURL,
    });

    userSelection = new FormData();
    userSelection.append(
      "inputImage",
      fileBlob,
      `${this.getLastURLParameter()}_${Date.now()}_${file.name}`
    );
    userSelection.append("model_id", this.getLastURLParameter());
  };

  handlePredict = async () => {
    // Check if user input image is null
    if (!userSelection.has("inputImage")) {
      alert("Please upload an image!");
    } else {
      try {
        // Add text query into form if present
        if (userSelection.has("text_query")) {
          userSelection.set("text_query", this.state.textInput);
        } else {
          userSelection.append("text_query", this.state.textInput);
        }

        // Check if text query null for selected models
        if (
          this.getModelInfo().Model_Name == "OwlVit" ||
          this.getModelInfo().Model_Name == "Segment Anything"
        ) {
          const textQuery = userSelection.get("text_query");
          if (!textQuery || textQuery.trim() === "") {
            alert("Please enter a query text!");
            return;
          }
        }

        // Generate a unique identifier for the image based on the current timestamp
        const uniqueId = Date.now();

        // Get the original file name from FormData
        const originalFileName = userSelection.get("inputImage").name;

        // Extract the file extension from the original file name
        const fileExtension = originalFileName.split(".").pop();

        // Create a new unique image name with the timestamp and file extension
        const imageName = `${this.getLastURLParameter()}_${uniqueId}.${fileExtension}`;

        // Update the FormData with the modified image name
        userSelection.set(
          "inputImage",
          userSelection.get("inputImage"),
          imageName
        );

        // Check userSelection before send to backend
        for (var pair of userSelection.entries()) {
          console.log(pair[0] + ", " + pair[1]);
        }

        console.log("Send to backend", userSelection);

        // Post to /insert-prediction
        const predictionResponse = await axios.post(
          `${BACKEND_URL}/insert-prediction`,
          userSelection,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log(
          "Response from /insert-prediction:",
          predictionResponse.data
        );

        var predictionResults = predictionResponse.data.dbResult;
        for (let key in predictionResults) {
          if (!Number.isInteger(Number(key))) {
            delete predictionResults[key];
          }
        }

        if (
          typeof predictionResults === "object" &&
          predictionResults !== null
        ) {
          let tempResultsList = [];

          for (let key in predictionResults) {
            if (predictionResults.hasOwnProperty(key)) {
              tempResultsList.push(predictionResults[key]);
            }
          }

          outputResults = tempResultsList;
        } else {
          outputResults = predictionResults;
        }
        // Post to /user-selection
        const selectionResponse = await axios.post(
          `${BACKEND_URL}/user-selection`,
          userSelection,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Update Output image with the response from /user-selection
        this.updateOutput(selectionResponse.data);
      } catch (error) {
        console.error("Error sending user selection data:", error);
      }
    }
  };

  updateOutput = (newImage) => {
    predictedOutput["src"] = `${BACKEND_URL}/${newImage["outputImage"]}`; // to be changeed to response data
    console.log(predictedOutput);
    this.forceUpdate(); // Refresh
  };

  /* Drag and Drop feature */
  handleDragOver = (event) => {
    // Prevent the default browser behavior
    event.preventDefault();
  };

  handleDrop = (event) => {
    // Prevent the default browser behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      // Handle the files
      this.handleDragFileUpload(event.dataTransfer.files[0]);

      // Clear the drag data cache (for all formats/types)
      event.dataTransfer.clearData();
    }
  };

  handleDragEnter = (event) => {
    // You can update the state to show some visual feedback
    this.setState({ isDragActive: true });
  };

  handleDragLeave = (event) => {
    // Update the state to remove visual feedback
    this.setState({ isDragActive: false });
  };

  /* Change to other models */
  handleBoxClick = (boxId) => {
    this.setState({ lastClickedBoxId: boxId });
    this.componentDidMount();
  };

  render() {
    const { all_model, capturedImage } = this.state;
    const lastURLParameter = this.getLastURLParameter();
    let modelInfo = this.getModelInfo();

    if (!modelInfo) {
      return <div>LOADING</div>;
    }

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
                        {modelInfo.Model_Name}
                      </h1>
                      <p className="lead text-white">
                        {modelInfo.Model_Type}
                        <br />
                        {modelInfo.Model_Version}
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
          </div>
          <section className="section section-lg">
            <Container>
              <Row>
                <Col lg="6" sm="12" className="mt-3">
                  <div
                    className="bg-secondary p-3 d-flex flex-column"
                    style={{ height: "375px", borderRadius: "30px" }}
                    onDragOver={this.handleDragOver}
                    onDrop={this.handleDrop}
                    onDragEnter={this.handleDragEnter}
                    onDragLeave={this.handleDragLeave}
                    id="uploadFile"
                  >
                    <h3>Input</h3>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ flexGrow: 1, overflow: "hidden" }}
                    >
                      {this.state.isCameraOn ? (
                        <Webcam
                          audio={false}
                          ref={this.webcamRef}
                          screenshotFormat="image/jpeg"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      ) : this.state.capturedImage ? (
                        <img
                          src={this.state.capturedImage}
                          alt="Uploaded Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <i
                          className="fa fa-upload"
                          style={{ fontSize: "24px" }}
                        ></i>
                      )}
                    </div>
                  </div>
                  {modelInfo.Model_Name == "OwlVit" ||
                  modelInfo.Model_Name == "Segment Anything" ? (
                    <div>
                      <div className="d-flex align-items-center justify-content-center mt-4 px-5">
                        <div className="form-group">
                          <input
                            placeholder="Text Query (eg. dog,cat,human)"
                            type="text"
                            class="form-control"
                            style={{ width: "325px" }}
                            onChange={this.handleTextInputChange}
                          />
                        </div>
                      </div>
                      <div className="d-flex align-items-center justify-content-center mt-2 px-5">
                        <input
                          type="file"
                          id="fileInput"
                          accept="image/*" // Optional: specify accepted file types
                          onChange={this.handleFileUpload}
                          hidden
                        />
                        <Button
                          color="info"
                          type="button"
                          style={{ width: "150px" }}
                        >
                          <label for="fileInput" className="m-0">
                            <span className="btn-inner--icon mr-1">
                              <i className="fa fa-upload" />
                            </span>
                            <span className="btn-inner--text">Upload</span>
                          </label>
                        </Button>

                        <Button
                          color={this.state.isCameraOn ? "success" : "info"}
                          type="button"
                          onClick={this.toggleWebcam}
                          style={{ width: "150px" }}
                          className="desktop-only"
                        >
                          <span className="btn-inner--icon mr-1">
                            <i
                              className={
                                this.state.isCameraOn
                                  ? "fa fa-dot-circle-o"
                                  : "fa fa-camera"
                              }
                            />
                          </span>
                          <span className="btn-inner--text">
                            {this.state.isCameraOn ? "Capture" : "Camera"}
                          </span>
                        </Button>

                        <Button
                          // className="btn-icon mb-3 mb-sm-0"
                          type="button"
                          color="warning"
                          onClick={this.handlePredict}
                          style={{ width: "150px" }}
                        >
                          <span className="btn-inner--icon mr-1">
                            <i className="fa fa-tag" />
                          </span>
                          <span className="btn-inner--text">Predict</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center mt-3 px-5">
                      <input
                        type="file"
                        id="fileInput"
                        accept="image/*" // Optional: specify accepted file types
                        onChange={this.handleFileUpload}
                        hidden
                      />
                      <Button
                        color="info"
                        type="button"
                        style={{ width: "150px" }}
                      >
                        <label for="fileInput" className="m-0">
                          <span className="btn-inner--icon mr-1">
                            <i className="fa fa-upload" />
                          </span>
                          <span className="btn-inner--text">Upload</span>
                        </label>
                      </Button>

                      <Button
                        color={this.state.isCameraOn ? "success" : "info"}
                        type="button"
                        onClick={this.toggleWebcam}
                        style={{ width: "150px" }}
                        className="desktop-only"
                      >
                        <span className="btn-inner--icon mr-1">
                          <i
                            className={
                              this.state.isCameraOn
                                ? "fa fa-dot-circle-o"
                                : "fa fa-camera"
                            }
                          />
                        </span>
                        <span className="btn-inner--text">
                          {this.state.isCameraOn ? "Capture" : "Camera"}
                        </span>
                      </Button>

                      <Button
                        // className="btn-icon mb-3 mb-sm-0"
                        type="button"
                        color="warning"
                        onClick={this.handlePredict}
                        style={{ width: "150px" }}
                      >
                        <span className="btn-inner--icon mr-1">
                          <i className="fa fa-tag" />
                        </span>
                        <span className="btn-inner--text">Predict</span>
                      </Button>
                    </div>
                  )}
                </Col>

                <Col lg="6" sm="12" className="mt-3">
                  <div
                    className="bg-secondary p-3 d-flex flex-column"
                    style={{ height: "375px", borderRadius: "30px" }}
                  >
                    <h3>Output</h3>
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{ flexGrow: 1, overflow: "hidden" }}
                    >
                      {predictedOutput.src ? (
                        <img
                          src={predictedOutput.src}
                          alt="Predicted Output"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <i
                          className="fa fa-image"
                          style={{ fontSize: "24px" }}
                        ></i>
                      )}
                    </div>
                  </div>

                  <div>
                    <table className="table align-items-center mt-3">
                      <thead className="thead-light" id="OutputTable">
                        <tr>
                          <th scope="col" className="sort">
                            Class
                          </th>
                          <th scope="col" className="sort">
                            Confidence
                          </th>
                        </tr>
                      </thead>
                      <tbody className="list">
                        {outputResults.map((result, index) => (
                          <tr key={index}>
                            <td>{result.name}</td>
                            <td>{result.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Col>
              </Row>
            </Container>
          </section>
        </main>
        <section className="bg-secondary">
          {/* <Container className="py-4">
            <h3>Analytics</h3>
            {this.state.monthData && this.state.monthData.length > 0 && (
              <LineChart
                chartData={this.state.monthData}
                labels={this.state.labels}
                titleName={"Monthly Usage"}
              />
            )}
          </Container> */}
        </section>
        <section className="section section-lg bg-secondary">
          <Container>
            <h3>Other {modelInfo.Model_Version} models</h3>
            <Row>{this.renderBoxes(modelInfo.Model_Version)}</Row>
          </Container>
        </section>
        <CardsFooter />
      </>
    );
  }

  renderBox(box) {
    return (
      <Link
        to={`/model/${box._id}`}
        className="custom-box-container custom-container custom-box"
        onClick={() => this.handleBoxClick(box._id)}
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
    const { all_model } = this.state; // Retrieve all_model from the state

    const filteredModels = all_model.filter(
      (box) =>
        box.Model_Version === modelType && box._id != this.getModelInfo()._id
    );

    // Check if all_model is not empty
    if (!filteredModels || filteredModels.length === 0) {
      return <p>No segmentation models available.</p>; // Return an empty array if there are no models
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
