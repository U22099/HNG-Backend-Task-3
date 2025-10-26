🌍 **Global Country Data API**

A robust Node.js Express backend service that efficiently fetches, stores, and serves rich data about countries worldwide. This API integrates with external sources for real-time currency exchange rates and dynamically calculates estimated GDP, providing a comprehensive and up-to-date global information hub. It features intelligent data refreshing, flexible querying, and dynamic data visualization capabilities to deliver a powerful data solution.

## Overview

This Node.js Express API leverages Sequelize ORM to manage and serve global country, currency, and economic data, integrating with external APIs for data enrichment and dynamic image generation using Sharp.

## Features

* 🌐 **Comprehensive Country Data Integration**: Fetches and persists detailed country information (capital, region, population, flag URL) from `restcountries.com`.
* 💱 **Real-time Currency Exchange Rates**: Dynamically updates currency exchange rates against USD via `open.er-api.com`.
* 📊 **Intelligent GDP Estimation**: Calculates estimated GDP for each country based on population, a dynamic multiplier, and current exchange rates.
* 🔄 **On-Demand Data Refresh**: Provides an API endpoint to manually trigger a full synchronization and update of all country and currency data.
* 🔍 **Advanced Data Querying**: Offers flexible filtering of countries by region and currency, along with sorting options by estimated GDP.
* 🖼️ **Dynamic Data Visualization**: Generates a rich PNG image summary displaying key statistics like total countries and top GDP performers.
* 🗑️ **Efficient Data Management**: Supports targeted deletion of country records by name.
* 📈 **Service Health Monitoring**: Exposes an endpoint to monitor the total number of stored countries and the timestamp of the last data refresh.

## Technologies Used

| Technology | Description |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| [![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/) | Server-side JavaScript runtime for building scalable network applications. |
| [![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/) | Fast, unopinionated, minimalist web framework for Node.js, providing robust features for web and mobile applications. |
| [![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=flat-square&logo=sequelize&logoColor=white)](https://sequelize.org/) | A powerful promise-based Node.js ORM for Postgres, MySQL, MariaDB, SQLite, and SQL Server, simplifying database interactions. |
| [![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/) | A widely used open-source relational database management system for structured data storage. |
| [![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/) | A highly popular promise-based HTTP client for the browser and node.js, used for making API requests. |
| [![Sharp](https://img.shields.io/badge/Sharp-000000?style=flat-square&logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com/) | High-performance Node.js library for converting, resizing, and compositing images, used here for generating data summaries. |
| [![Dotenv](https://img.shields.io/badge/Dotenv-FFE042?style=flat-square&logo=dotenv&logoColor=black)](https://github.com/motdotla/dotenv) | A zero-dependency module that loads environment variables from a `.env` file into `process.env`. |

## Getting Started

To get this project up and running on your local machine, follow these steps.

### Installation

* 📥 **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd HNG-Backend-Task-3
    ```

* 📦 **Install Dependencies**:

    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory and add the following required environment variables:

```
PORT=5000
DATABASE_URL="mysql://user:password@host:port/database_name"
```

**Example**:

```
PORT=5000
DATABASE_URL="mysql://root:mysecretpassword@localhost:3306/country_db"
```

## API Documentation

### Base URL

The base URL for all API endpoints is `http://localhost:5000` (or your configured `PORT`).

### Endpoints

#### `POST /countries/refresh`

Triggers a full refresh of country data from external APIs and updates the database. This operation also generates a summary image.
**Request**:
(No request body)
**Response**:

```json
{
  "message": "Data refreshed successfully"
}
```

**Errors**:
* `503 Service Unavailable`: External data source unavailable.

  ```json
  {
    "error": "External data source unavailable",
    "details": "Could not fetch data from https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
  }
  ```

- `500 Internal Server Error`: An unexpected server-side error occurred.

#### `GET /countries`

Retrieves a list of countries, with optional filtering and sorting.
**Request**:

Query parameters:
* `region` (Optional): Filters countries by their geographical region (e.g., `Africa`, `Europe`).
* `currency` (Optional): Filters countries by their primary currency code (e.g., `USD`, `EUR`).
* `sort` (Optional): Specifies the sorting order. Currently supports `gdp_desc` for descending estimated GDP.
  _Example Query_: `/countries?region=Europe&currency=EUR&sort=gdp_desc`
**Response**:

```json
[
  {
    "id": 1,
    "name": "Germany",
    "capital": "Berlin",
    "region": "Europe",
    "population": 83783942,
    "currency_code": "EUR",
    "exchange_rate": 0.92,
    "estimated_gdp": 4500000000000,
    "flag_url": "https://flagcdn.com/de.svg",
    "last_refreshed_at": "2023-10-27T10:00:00.000Z",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
  // ... potentially more country objects
]
```

**Errors**:
* `500 Internal Server Error`: An unexpected server-side error occurred.

#### `GET /countries/:name`

Retrieves detailed information for a specific country by its name.
**Request**:
Path parameter:
* `name` (Required): The full name of the country. Case-insensitive matching.
  _Example Path_: `/countries/nigeria`
**Response**:

```json
{
  "id": 12,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139587,
  "currency_code": "NGN",
  "exchange_rate": 1500,
  "estimated_gdp": 1200000000000,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2023-10-27T10:00:00.000Z",
  "createdAt": "2023-10-27T10:00:00.000Z",
  "updatedAt": "2023-10-27T10:00:00.000Z"
}
```

**Errors**:
* `404 Not Found`: Country with the specified name does not exist.

  ```json
  {
    "error": "Country not found"
  }
  ```

- `500 Internal Server Error`: An unexpected server-side error occurred.

#### `DELETE /countries/:name`

Deletes a specific country record from the database by its name.
**Request**:
Path parameter:
* `name` (Required): The full name of the country to delete. Case-insensitive matching.
  _Example Path_: `/countries/canada`
**Response**:

```json
{
  "message": "Country deleted successfully"
}
```

**Errors**:
* `404 Not Found`: Country with the specified name does not exist.

  ```json
  {
    "error": "Country not found"
  }
  ```

- `500 Internal Server Error`: An unexpected server-side error occurred.

#### `GET /status`

Provides the current status of the country data, including total count and last refresh timestamp.
**Request**:
(No request body or parameters)
**Response**:

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2023-10-27T10:00:00.000Z"
}
```

**Errors**:
* `500 Internal Server Error`: An unexpected server-side error occurred.

#### `GET /countries/image`

Retrieves a dynamically generated PNG image summarizing the stored country data.
**Request**:
(No request body or parameters)
**Response**:
A PNG image file (binary data).
**Errors**:
* `404 Not Found`: The summary image has not been generated yet or could not be found.

  ```json
  {
    "error": "Summary image not found"
  }
  ```

- `500 Internal Server Error`: An unexpected server-side error occurred.

## Usage

After setting up the project and starting the server, you can interact with the API using `curl` or any API client.

1. **Start the Server**:

    ```bash
    npm start
    ```

    The server will be running on `http://localhost:5000` (or your chosen `PORT`).

2. **Refresh Country Data**:
    Before querying, ensure the database is populated.

    ```bash
    curl -X POST http://localhost:5000/countries/refresh
    ```

3. **Get All Countries**:

    ```bash
    curl http://localhost:5000/countries
    ```

4. **Get Countries Filtered by Region and Sorted by GDP**:

    ```bash
    curl "http://localhost:5000/countries?region=Asia&sort=gdp_desc"
    ```

5. **Get Details for a Specific Country**:

    ```bash
    curl http://localhost:5000/countries/japan
    ```

6. **Delete a Country**:

    ```bash
    curl -X DELETE http://localhost:5000/countries/france
    ```

7. **Check Service Status**:

    ```bash
    curl http://localhost:5000/status
    ```

8. **Retrieve Summary Image**:

    ```bash
    curl http://localhost:5000/countries/image --output summary.png
    ```

## Contributing

We welcome contributions to enhance this project! If you're looking to contribute, please follow these guidelines:

* 🍴 **Fork the Repository**: Start by forking the project to your GitHub account.
* 🌿 **Create a New Branch**: Create a dedicated branch for your feature or bug fix:

    ```bash
    git checkout -b feature/your-feature-name
    ```

* 💡 **Implement Your Changes**: Write clean, well-documented code that adheres to the project's style.
* ➕ **Commit Your Changes**: Commit your work with clear, concise messages:

    ```bash
    git commit -m 'feat: Add new feature for X'
    ```

* 🚀 **Push to Your Branch**: Push your local branch to your forked repository:

    ```bash
    git push origin feature/your-feature-name
    ```

* 🤝 **Open a Pull Request**: Submit a pull request to the main repository, describing your changes and their benefits.

## License

This project is licensed under the MIT License.

## Author Info

**[Your Name Here]**

* 🌐 LinkedIn: [Your LinkedIn Profile]
* 🐦 Twitter: [@YourTwitterHandle]

---

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![Sharp](https://img.shields.io/badge/Sharp-000000?style=for-the-badge&logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
