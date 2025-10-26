import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Country = sequelize.define("Country", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capital: DataTypes.STRING,
    region: DataTypes.STRING,
    population: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    currency_code: DataTypes.STRING(10),
    exchange_rate: DataTypes.FLOAT,
    estimated_gdp: DataTypes.FLOAT,
    flag_url: DataTypes.STRING,
    last_refreshed_at: DataTypes.DATE,
  });

  const Metadata = sequelize.define("Metadata", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    value: DataTypes.STRING,
  });

  return { Country, Metadata };
};
