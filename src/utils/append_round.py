from coal_train_cup.services.sheets_service import worksheet_to_dataframe, dataframe_to_worksheet
import pandas as pd


def append_round() -> pd.DataFrame:
    existing = worksheet_to_dataframe("tips", "migration")

    print(existing.shape)

    new = worksheet_to_dataframe("tips", "new")

    print(new.shape)

    # Check for duplicate emails in new dataframe
    duplicates = new[new.duplicated(subset=['email'], keep=False)]
    if not duplicates.empty:
        print("\nDuplicate entries found in new data:")
        print(duplicates)

    result = pd.merge(existing, new, on="email", how="left")
    
    # Replace NaN values with empty string
    result = result.fillna("")
    
    print(result.shape)
    print(result.head())
    print(result.tail())

    dataframe_to_worksheet(result, "tips", "appended")


if __name__ == "__main__":
    append_round()
